
from flask import Flask, request, jsonify, send_file
import os
import tempfile
import zipfile

# Add the libModMii directory to Python path if needed
from libModMii.download import download_entry
from libModMii.syscheck import analyse_syscheck_data
from libModMii.download import get_database_entry

from s3_helpers import file_exists_in_s3, download_file_from_s3, upload_file_to_s3, generate_wad_s3_key



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

        with tempfile.TemporaryDirectory() as temp_dir:
            files_to_zip = []
            for entry in entries:
                db_entry = get_database_entry(entry)
                wad_filename = db_entry.wadname if hasattr(db_entry, 'wadname') else (f"{entry}.wad" if not entry.endswith('.wad') else entry)
                s3_key = generate_wad_s3_key(wad_filename)
                local_wad_path = os.path.join(temp_dir, wad_filename)

                if file_exists_in_s3(s3_key):
                    # Download from S3 to temp_dir
                    download_file_from_s3(s3_key, local_wad_path)
                else:
                    # Download using libModMii
                    result = download_entry(entry, temp_dir)
                    print(f"Downloaded {result['wadname']} to {result['outputPath']}")
                    # Upload to S3
                    if os.path.exists(local_wad_path):
                        upload_file_to_s3(local_wad_path, s3_key, content_type="application/octet-stream")
                # Add to zip list if file exists
                if os.path.exists(local_wad_path):
                    files_to_zip.append(local_wad_path)

            # Create ZIP archive
            zip_filename = os.path.join(temp_dir, "wad_files.zip")
            with zipfile.ZipFile(zip_filename, 'w', zipfile.ZIP_DEFLATED) as zipf:
                for file_path in files_to_zip:
                    zipf.write(file_path, os.path.basename(file_path))

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
