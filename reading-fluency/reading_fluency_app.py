#!/usr/bin/env python3
"""
Simple Reading Fluency Analyzer
A clean, focused Flask app for analyzing reading fluency using Lelapa AI and Whisper fallback.
"""

import os
import tempfile
import requests
import librosa
import whisper
from datetime import datetime
from pathlib import Path
from flask import Flask, render_template, request, jsonify, Response
from dotenv import load_dotenv
import threading
import json
import time
import uuid
from pydub import AudioSegment

load_dotenv()

app = Flask(__name__)

# Configuration
LELAPA_API_TOKEN = os.getenv('LELAPA_API_TOKEN')
LELAPA_ENDPOINT = "https://vulavula-services.lelapa.ai/api/v2alpha/transcribe/sync/file"

# Language mapping
LANGUAGE_CODES = {
    'english': 'eng',
    'afrikaans': 'afr', 
    'sesotho': 'sot',
    'zulu': 'zul'
}

# Reading fluency standards (words per minute)
FLUENCY_STANDARDS = {
    'grade_r': {'slow': 0, 'target': 10, 'good': 20},
    'grade_1': {'slow': 10, 'target': 30, 'good': 50},
    'grade_2': {'slow': 30, 'target': 60, 'good': 90},
    'grade_3': {'slow': 60, 'target': 90, 'good': 120},
}

# Global instances
whisper_model = None
analysis_tasks = {}

def get_whisper_model():
    """Load Whisper model lazily."""
    global whisper_model
    if whisper_model is None:
        whisper_model = whisper.load_model("base")
    return whisper_model

def convert_to_mp3(input_path: str) -> str:
    """Convert audio file to MP3 format."""
    try:
        audio = AudioSegment.from_file(input_path)
        output_path = input_path.rsplit('.', 1)[0] + '.mp3'
        audio.export(output_path, format="mp3")
        return output_path
    except Exception as e:
        print(f"Audio conversion failed: {e}")
        return None

def transcribe_with_lelapa(audio_path: str, language: str) -> dict:
    """Transcribe audio using Lelapa AI API."""
    if not LELAPA_API_TOKEN:
        return {'success': False, 'error': 'No Lelapa API token configured'}
    
    if language not in LANGUAGE_CODES:
        return {'success': False, 'error': f'Unsupported language: {language}'}
    
    try:
        headers = {"X-CLIENT-TOKEN": LELAPA_API_TOKEN}
        params = {"lang_code": LANGUAGE_CODES[language]}
        
        with open(audio_path, 'rb') as f:
            files = {'file': (os.path.basename(audio_path), f.read(), 'audio/mp3')}
        
        response = requests.post(
            LELAPA_ENDPOINT,
            headers=headers,
            files=files,
            params=params,
            timeout=120
        )
        
        if response.status_code == 200:
            data = response.json()
            return {
                'success': True,
                'text': data.get('transcription_text', ''),
                'service': 'lelapa'
            }
        else:
            return {
                'success': False, 
                'error': f"Lelapa API error {response.status_code}: {response.text}"
            }
            
    except Exception as e:
        return {'success': False, 'error': f"Lelapa request failed: {str(e)}"}

def transcribe_with_whisper(audio_path: str) -> dict:
    """Transcribe audio using Whisper as fallback."""
    try:
        model = get_whisper_model()
        result = model.transcribe(audio_path)
        return {
            'success': True,
            'text': result["text"].strip(),
            'service': 'whisper'
        }
    except Exception as e:
        return {'success': False, 'error': f"Whisper transcription failed: {str(e)}"}

def count_words(text: str) -> int:
    """Count words in transcribed text."""
    if not text:
        return 0
    return len([word for word in text.strip().split() if word.strip()])

def assess_fluency(wpm: float, grade_level: str) -> dict:
    """Assess reading fluency level based on words per minute."""
    standards = FLUENCY_STANDARDS.get(grade_level, FLUENCY_STANDARDS['grade_1'])
    
    if wpm < standards['slow']:
        level, emoji, color = 'Needs Support', '🐌', '#e74c3c'
        recommendation = 'Focus on sight words and guided reading practice.'
    elif wpm < standards['target']:
        level, emoji, color = 'Developing', '📖', '#f39c12'
        recommendation = 'Continue with regular reading practice.'
    elif wpm < standards['good']:
        level, emoji, color = 'On Track', '⭐', '#A7D36F'
        recommendation = 'Great progress! Focus on comprehension.'
    else:
        level, emoji, color = 'Excellent', '🏆', '#4834d4'
        recommendation = 'Outstanding fluency! Focus on advanced comprehension.'
    
    return {
        'level': level,
        'emoji': emoji,
        'color': color,
        'wpm': wpm,
        'target_wpm': standards['target'],
        'recommendation': recommendation
    }

def analyze_audio_task(task_id: str, audio_path: str, language: str, grade_level: str):
    """Background task to analyze audio recording."""
    def log(message):
        if task_id in analysis_tasks:
            analysis_tasks[task_id]['messages'].append(message)
        print(f"Task {task_id}: {message}")
    
    try:
        analysis_tasks[task_id]['status'] = 'processing'
        log("🎯 Starting reading fluency analysis...")
        
        # Convert to MP3
        log("🔄 Converting audio to MP3...")
        mp3_path = convert_to_mp3(audio_path)
        if not mp3_path:
            raise Exception("Audio conversion failed")
        
        # Get audio duration
        duration = librosa.get_duration(path=mp3_path)
        log(f"📊 Audio duration: {duration:.1f} seconds")
        
        # Transcribe with Lelapa first, fallback to Whisper
        log(f"🌍 Transcribing with Lelapa AI ({language})...")
        result = transcribe_with_lelapa(mp3_path, language)
        
        if not result['success'] and language == 'english':
            log("⚠️ Lelapa failed, falling back to Whisper...")
            result = transcribe_with_whisper(mp3_path)
        
        if not result['success']:
            raise Exception(result['error'])
        
        transcribed_text = result['text']
        service_used = result['service']
        log(f"✅ Transcription successful with {service_used}")
        
        # Calculate WPM
        word_count = count_words(transcribed_text)
        duration_minutes = duration / 60
        wpm = round(word_count / duration_minutes, 1) if duration_minutes > 0 else 0
        
        log(f"📝 Word count: {word_count}, WPM: {wpm}")
        
        # Assess fluency
        fluency_assessment = assess_fluency(wpm, grade_level)
        
        # Store results
        results = {
            'success': True,
            'transcription_service': service_used,
            'language': language,
            'grade_level': grade_level,
            'audio_duration_seconds': round(duration, 2),
            'transcribed_text': transcribed_text,
            'word_count': word_count,
            'words_per_minute': wpm,
            'fluency_assessment': fluency_assessment
        }
        
        analysis_tasks[task_id]['status'] = 'complete'
        analysis_tasks[task_id]['result'] = results
        log("🎉 Analysis complete!")
        
        # Cleanup
        if os.path.exists(mp3_path) and mp3_path != audio_path:
            os.remove(mp3_path)
        
    except Exception as e:
        error_msg = str(e)
        log(f"❌ Error: {error_msg}")
        analysis_tasks[task_id]['status'] = 'failed'
        analysis_tasks[task_id]['result'] = {'error': error_msg}
    
    finally:
        # Cleanup original file
        if os.path.exists(audio_path):
            os.remove(audio_path)

@app.route('/')
def index():
    """Serve the main interface."""
    return render_template('index.html')

@app.route('/analyze_audio', methods=['POST'])
def analyze_audio():
    """Start audio analysis task."""
    if 'audio' not in request.files:
        return jsonify({'error': 'No audio file provided'}), 400
    
    audio_file = request.files['audio']
    language = request.form.get('language', 'english')
    grade_level = request.form.get('grade_level', 'grade_1')
    
    # Save uploaded file
    suffix = Path(audio_file.filename).suffix if audio_file.filename else '.webm'
    temp_fd, temp_path = tempfile.mkstemp(suffix=suffix)
    os.close(temp_fd)
    audio_file.save(temp_path)
    
    # Create analysis task
    task_id = str(uuid.uuid4())
    analysis_tasks[task_id] = {
        'status': 'queued',
        'messages': ['Task received. Starting analysis...'],
        'result': None
    }
    
    # Start background analysis
    thread = threading.Thread(
        target=analyze_audio_task,
        args=(task_id, temp_path, language, grade_level)
    )
    thread.daemon = True
    thread.start()
    
    return jsonify({'task_id': task_id})

@app.route('/status/<task_id>')
def status_stream(task_id):
    """Stream analysis status updates."""
    if task_id not in analysis_tasks:
        return jsonify({'error': 'Invalid task ID'}), 404
    
    def generate():
        last_sent_index = 0
        while True:
            task = analysis_tasks.get(task_id)
            if not task:
                break
            
            # Send new messages
            messages = task['messages']
            if len(messages) > last_sent_index:
                for i in range(last_sent_index, len(messages)):
                    yield f"data: {messages[i]}\n\n"
                last_sent_index = len(messages)
            
            # Check if complete
            if task['status'] in ['complete', 'failed']:
                final_result = task.get('result', {})
                yield f"event: complete\ndata: {json.dumps(final_result)}\n\n"
                break
            
            time.sleep(0.2)
    
    return Response(generate(), mimetype='text/event-stream')

@app.route('/health')
def health():
    """Health check endpoint."""
    return jsonify({
        'status': 'healthy',
        'lelapa_configured': bool(LELAPA_API_TOKEN),
        'whisper_loaded': whisper_model is not None
    })

if __name__ == '__main__':
    print("🚀 Starting Reading Fluency Analyzer...")
    print("🌍 Supported languages:", list(LANGUAGE_CODES.keys()))
    print("📊 Grade levels:", list(FLUENCY_STANDARDS.keys()))
    
    if LELAPA_API_TOKEN:
        print("✅ Lelapa API token configured")
    else:
        print("⚠️ No Lelapa API token - will use Whisper only")
    
    app.run(debug=True, host='0.0.0.0', port=8000)