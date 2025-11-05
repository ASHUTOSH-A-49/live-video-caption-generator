import os
import threading
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO, emit
from werkzeug.utils import secure_filename

from config import config
from modules.audio_processor import AudioProcessor
from modules.speech_to_text import SpeechToText
from modules.nlp_simplifier import TextSimplifier
from modules.youtube_handler import YouTubeHandler
from modules.libretranslate_api import LibreTranslator

libre_translator = LibreTranslator()


app = Flask(__name__)
app.config.from_object(config['development'])
# ADD THESE LINES FOR CORS
CORS(app, resources={
    r"/upload": {"origins": "*"},
    r"/health": {"origins": "*"}
})

socketio = SocketIO(app, cors_allowed_origins="*")

os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

LANGUAGE_CODES = {
    'en': 'en',
    'hi': 'hi',
    'ta': 'ta',
    'bn': 'bn',
    'te': 'te',
    'ml': 'ml',
    'mr': 'mr',
}

@app.route('/upload', methods=['POST'])
def upload_file():
    """Handle file upload"""
    if 'file' not in request.files:
        return jsonify({'error': 'No file'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    try:
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        return jsonify({
            'success': True,
            'path': filepath,
            'filename': filename
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@socketio.on('connect')
def handle_connect():
    print(f"✅ Client connected: {request.sid}")
    emit('connection_response', {'data': 'Connected!'})

@socketio.on('start_transcription')
def handle_start_transcription(data):
    print("Starting transcription job")
    video_path = data.get('video_path')
    lang = data.get('lang', 'en')
    
    print(f"🎬 Transcribing: {video_path}")
    
    thread = threading.Thread(
        target=transcribe_video,
        args=(video_path, lang, request.sid)
    )
    thread.start()

@socketio.on('process_youtube')
def handle_process_youtube(data):
    youtube_url = data.get('url')
    lang = data.get('lang', 'en')
    print(f"📺 Received YouTube request: {youtube_url}")
    print(f"📺 YouTube: {youtube_url}")
    
    thread = threading.Thread(
        target=process_youtube,
        args=(youtube_url, lang, request.sid)
    )
    thread.start()

def transcribe_video(video_path, lang, client_id):
    try:
        audio_path = AudioProcessor.extract_audio_from_video(video_path, "temp_audio.wav")

        if not audio_path:
            socketio.emit('error', {'message': 'Failed to extract audio'}, to=client_id)
            return

        language_code = LANGUAGE_CODES.get(lang, 'en')
        transcriber = SpeechToText(language_code)
        simplifier = TextSimplifier()

        result = transcriber.transcribe_audio_file(audio_path)
        if result['transcript']:
            simplified = simplifier.simplify_text(result['transcript'])

            # Translate from English to Hindi if selected language is Hindi and transcription is English
            if lang == 'hi' and language_code == 'en':
                translated = libre_translator.translate_text(simplified, source_lang='en', target_lang='hi')
            else:
                translated = simplified

            socketio.emit('caption', {
                'text': translated,
                'original': result['transcript'],
                'confidence': result['confidence'],
            }, to=client_id)

        socketio.emit('done', {'transcript': result['transcript']}, to=client_id)

        if os.path.exists(audio_path):
            os.remove(audio_path)

    except Exception as e:
        socketio.emit('error', {'message': str(e)}, to=client_id)



def process_youtube(youtube_url, lang, client_id):
    try:
        print(f"📺 Processing YouTube: {youtube_url}")
        print(f"🌍 Language: {lang}")
        
        audio_path = YouTubeHandler.download_youtube_audio(youtube_url, "temp_youtube.wav")
        if not audio_path:
            socketio.emit('error', {'message': 'Failed to download'}, to=client_id)
            return
        
        language_code = LANGUAGE_CODES.get(lang, 'en')
        transcriber = SpeechToText(language_code)
        simplifier = TextSimplifier()
        
        result = transcriber.transcribe_audio_file(audio_path)
        if result['transcript']:
            simplified = simplifier.simplify_text(result['transcript'])
            
            # Translate to Hindi if needed
            if lang == 'hi' and language_code == 'en':
                translated = libre_translator.translate_text(simplified, source_lang='en', target_lang='hi')
            else:
                translated = simplified
            
            socketio.emit('caption', {
                'text': translated,
                'original': result['transcript'],
                'confidence': result['confidence'],
            }, to=client_id)
        
        socketio.emit('done', {'transcript': result['transcript']}, to=client_id)
        
        if os.path.exists(audio_path):
            os.remove(audio_path)
    
    except Exception as e:
        print(f"❌ Error: {e}")
        socketio.emit('error', {'message': str(e)}, to=client_id)

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': '✅ Backend running'}), 200

if __name__ == '__main__':
    print("=" * 60)
    print("🚀 Backend: http://localhost:5000")
    print("=" * 60)
    socketio.run(app, host='0.0.0.0', port=5000, debug=True)
