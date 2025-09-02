# ModMii Wrapper - Enhanced with Prompt Handling

This enhanced version of the ModMii wrapper adds intelligent prompt handling capabilities to automatically respond to interactive prompts from ModMii commands.

## Features

### 1. Real-time Output Streaming

- Display command output as it's generated (not just after completion)
- Prefix output lines with `[OUT]` for stdout and `[ERR]` for stderr
- Maintain original functionality when streaming is disabled

### 2. Automatic Prompt Detection & Response

- Detect when ModMii is waiting for user input
- Automatically respond based on configurable patterns
- Support for both regex patterns and sequential responses
- Configurable timeout for prompt detection

### 3. Common Prompt Patterns

Built-in support for common prompts:

- `(Y/N)` and `(y/n)` prompts
- "Press any key" prompts
- "Continue?" and "Proceed?" prompts
- "Would you like to..." questions

## Usage Examples

### Basic Usage (No Changes)

```python
from modmii_wrapper import run_command_with_output

# Original functionality still works
result = run_command_with_output(['help'])
print(result['stdout'])
```

### Streaming Output

```python
# Enable real-time output display
result = run_command_with_output(['help'], stream_output=True)
```

### Automatic Prompt Responses (Pattern-based)

```python
# Define responses for specific prompt patterns
auto_responses = {
    r'Would you like to install.*Priiloader.*\(Y/N\)': 'Y',
    r'Continue with installation\?': 'Y',
    r'\(Y/N\)': 'N',  # Default response for any Y/N prompt
    r'Press any key': '\n'
}

result = run_command_with_output(
    ['SU', 'syscheck.csv'],
    stream_output=True,
    auto_responses=auto_responses,
    prompt_timeout=5  # Wait 5 seconds before considering it a prompt
)
```

### Sequential Responses

```python
# Provide responses in order (useful when you know the sequence)
responses = ['Y', 'N', 'Y', '\n']  # First prompt: Y, Second: N, etc.

result = run_command_with_output(
    ['command'],
    stream_output=True,
    auto_responses=responses
)
```

### SysCheck Updater with Prompt Handling

```python
from modmii_wrapper import syscheck_updater

auto_responses = {
    r'Would you like to install.*Priiloader.*\(Y/N\)': 'Y',
    r'\(Y/N\)': 'N'  # Default to N for other prompts
}

with open('syscheck.csv', 'r') as f:
    csv_content = f.read()

result = syscheck_updater(
    csv_content,
    stream_output=True,
    auto_responses=auto_responses,
    prompt_timeout=3
)
```

## Parameters

### `run_command_with_output(args, stream_output=False, auto_responses=None, prompt_timeout=5)`

- **args**: Command arguments (string or list)
- **stream_output**: Enable real-time output display
- **auto_responses**:
  - `None`: No automatic responses (original behavior)
  - `dict`: Map regex patterns to responses
  - `list`: Sequential responses in order
- **prompt_timeout**: Seconds to wait without output before checking for prompts

### `syscheck_updater(csv_str, stream_output=False, auto_responses=None, prompt_timeout=5)`

Same parameters as above, but takes CSV content as string.

## How Prompt Detection Works

1. **Output Monitoring**: The wrapper monitors command output in real-time
2. **Timeout Detection**: If no output is received for `prompt_timeout` seconds, it checks for prompts
3. **Pattern Matching**: Recent output (last 3 lines) is checked against:
   - User-defined patterns (in `auto_responses`)
   - Built-in common patterns
4. **Response Sending**: If a match is found, the corresponding response is sent to the process
5. **Fallback**: If no response is found, the process continues (may timeout eventually)

## Response Priority

1. User-defined regex patterns (in `auto_responses` dict)
2. Sequential responses (if `auto_responses` is a list)
3. Built-in common prompt patterns
4. No response (continues waiting, may timeout)

## Error Handling

- Graceful timeout handling (120 seconds maximum)
- Process cleanup on timeout or error
- Error reporting in returned dictionary
- Thread safety for concurrent I/O operations

## Example Output

```
[OUT] ModMii v8.0.4 Command Line Help
[OUT]
[OUT] Priiloader is already installed but SysCheck is unable to determine its version.
[OUT] Would you like to install the latest version of Priiloader now? (Y/N)
[PROMPT] No output for 3s, checking for prompts...
[PROMPT] Found pattern 'Would you like to install.*Priiloader.*\(Y/N\)', responding with 'Y'
[INPUT] Y
[OUT] Installing Priiloader...
```

This enhancement makes the ModMii wrapper much more suitable for automated scripts and batch processing while maintaining backward compatibility.
