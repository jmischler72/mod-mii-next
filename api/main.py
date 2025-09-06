
from flask import Flask, request, jsonify, send_file
import os
import tempfile
import zipfile

# Add the libModMii directory to Python path if needed
from libModMii.download import download_entries
from libModMii.syscheck import analyse_syscheck_data


app = Flask(__name__)

@app.route('/ping', methods=['GET'])
def ping():
    return jsonify({"message": "pong"})

@app.route('/download_entries', methods=['POST'])
def download_entries_route():
    """
    Download WAD files based on provided entry names.
    
    Expected JSON payload:
    {
        "entries": ["cIOS248[38]-d2x-v10-beta52", "IOS58", "yawm", ...]
    }
    
    Returns a ZIP archive containing all downloaded WAD files.
    """
    try:
        data = request.json
        if not data or 'entries' not in data:
            return jsonify({"error": "Invalid request. Expected 'entries' field with list of entry names."}), 400

        entries = data['entries']
        if not isinstance(entries, list) or not entries:
            return jsonify({"error": "Entries must be a non-empty list."}), 400

        # Create a temporary directory for downloads
        with tempfile.TemporaryDirectory() as temp_dir:
            # Download all entries to the temporary directory
            download_entries(entries)
            
            # Create a ZIP archive with all downloaded files
            zip_filename = os.path.join(temp_dir, "wad_files.zip")
            
            # Find the actual download directory (libModMii uses temp-downloads by default)
            download_dir = os.path.join(os.getcwd(), "temp-downloads")
            
            if not os.path.exists(download_dir):
                return jsonify({"error": "Download directory not found. Downloads may have failed."}), 500
            
            with zipfile.ZipFile(zip_filename, 'w', zipfile.ZIP_DEFLATED) as zipf:
                for entry in entries:
                    # Look for WAD files that match the entry names
                    for filename in os.listdir(download_dir):
                        if filename.endswith('.wad'):
                            file_path = os.path.join(download_dir, filename)
                            zipf.write(file_path, filename)
            
            if not os.path.exists(zip_filename):
                return jsonify({"error": "Failed to create archive."}), 500
                
            return send_file(
                zip_filename,
                as_attachment=True,
                download_name="wad_files.zip",
                mimetype="application/zip"
            )
            
    except Exception as e:
        return jsonify({"error": f"Download failed: {str(e)}"}), 500

@app.route('/get_syscheck_infos', methods=['POST'])
def get_syscheck_infos():
    """
    Analyze a SysCheck CSV file and return recommended WAD files to install.
    
    Expected JSON payload:
    {
        "syscheck_data": "csv content here...",
        "activeIOS": false,
        "extraProtection": false,
        "cMios": false
    }
    """
    try:
        data = request.json
        if not data or 'syscheck_data' not in data:
            return jsonify({"error": "Invalid request. Expected 'syscheck_data' field."}), 400

        syscheck_data = data['syscheck_data']
        active_ios = data.get('activeIOS', False)
        extra_protection = data.get('extraProtection', False)
        c_mios = data.get('cMios', False)

        # Analyze the syscheck data
        result = analyse_syscheck_data(
            syscheck_data,
            activeIOS=active_ios,
            extraProtection=extra_protection,
            cMios=c_mios
        )
        
        return jsonify({"analysis": result})
        
    except Exception as e:
        return jsonify({"error": f"Analysis failed: {str(e)}"}), 500


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=4000)
