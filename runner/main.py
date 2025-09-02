from dotenv import load_dotenv
load_dotenv()

import os
import zipfile
import tempfile
import shutil
from flask import Flask, request, jsonify, send_file
from modmii_wrapper import run_modmii_command, syscheck_updater

app = Flask(__name__)

@app.route('/ping', methods=['GET'])
def ping():
    return jsonify({"message": "pong"})

@app.route('/modmii', methods=['POST'])
def modmii():
    secret = os.environ.get('WINDOWS_SECRET')
    if request.headers.get('Authorization') != f'Bearer {secret}':
        return jsonify({'error': 'Unauthorized'}), 401
    print("Received request for ModMii")
    data = request.get_json(force=True)
    args = data.get('args', '')
    output_str = data.get('outputStr')
    debug = data.get('debug', False)
    result = run_modmii_command(args, output_str, debug)
    return jsonify(result)

@app.route('/syscheck', methods=['POST'])
def syscheck():
    """Process syscheck CSV and return COPY_TO_SD files as zip archive"""
    secret = os.environ.get('WINDOWS_SECRET')
    if request.headers.get('Authorization') != f'Bearer {secret}':
        return jsonify({'error': 'Unauthorized'}), 401
    
    print("Received request for SysCheck processing")
    data = request.get_json(force=True)
    csv_content = data.get('csvContent', '')
    
    if not csv_content:
        return jsonify({'error': 'csvContent is required'}), 400
    
    try:
        # Run syscheck updater
        print("Running SysCheck Updater...")
        result = syscheck_updater(csv_content, stream_output=False, prompt_timeout=3)
        
        if not result['success']:
            return jsonify({
                'error': 'SysCheck processing failed',
                'details': result['stderr'] or result['stdout']
            }), 500
        
        # Look for COPY_TO_SD directory
        copy_to_sd_path = os.path.join(os.path.dirname(__file__), 'modmii', 'COPY_TO_SD')
        
        if not os.path.exists(copy_to_sd_path):
            return jsonify({
                'error': 'COPY_TO_SD directory not found',
                'details': f'Path checked: {copy_to_sd_path}'
            }), 404
        
        # Create temporary zip file
        temp_zip = tempfile.NamedTemporaryFile(delete=False, suffix='.zip')
        temp_zip.close()
        
        try:
            with zipfile.ZipFile(temp_zip.name, 'w', zipfile.ZIP_DEFLATED) as zipf:
                # Add all files from COPY_TO_SD directory
                for root, dirs, files in os.walk(copy_to_sd_path):
                    for file in files:
                        file_path = os.path.join(root, file)
                        # Create archive path relative to COPY_TO_SD
                        archive_name = os.path.relpath(file_path, copy_to_sd_path)
                        zipf.write(file_path, archive_name)
                        print(f"Added to archive: {archive_name}")
            
            # Read zip file content
            with open(temp_zip.name, 'rb') as f:
                zip_data = f.read()
            
            # Clean up temporary file
            os.unlink(temp_zip.name)
            
            print(f"Created archive with {len(zip_data)} bytes")
            
            # Return the zip file as response
            response = Flask.response_class(
                response=zip_data,
                status=200,
                mimetype='application/zip',
                headers={
                    'Content-Disposition': 'attachment; filename="modmii-files.zip"',
                    'Content-Length': str(len(zip_data))
                }
            )
            return response
            
        except Exception as e:
            # Clean up on error
            if os.path.exists(temp_zip.name):
                os.unlink(temp_zip.name)
            raise e
            
    except Exception as e:
        print(f"Error processing syscheck: {str(e)}")
        return jsonify({
            'error': 'Internal server error',
            'details': str(e)
        }), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=4000)
