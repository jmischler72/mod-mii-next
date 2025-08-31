from flask import Flask, request, jsonify
from modmii_wrapper import run_command_with_output

app = Flask(__name__)

@app.route('/ping', methods=['GET'])
def ping():
    return jsonify({"message": "pong"})

@app.route('/modmii', methods=['POST'])
def modmii():
    data = request.get_json(force=True)
    args = data.get('args', '')
    output_str = data.get('outputStr')
    debug = data.get('debug', False)
    try:
        result = run_command_with_output(args, output_str, debug)
        return jsonify({"result": result})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=4000)
