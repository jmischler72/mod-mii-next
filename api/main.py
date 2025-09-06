
from flask import Flask, request, jsonify, send_file

app = Flask(__name__)

@app.route('/ping', methods=['GET'])
def ping():
    return jsonify({"message": "pong"})

@app.route('/get_syscheck_infos', methods=['POST'])
def get_syscheck_infos():
    return jsonify({"message": "f"})
   

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=4000)
