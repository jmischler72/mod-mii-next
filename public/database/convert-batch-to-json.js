const fs = require('fs');
const path = require('path');
const https = require('https');

// Download DB.bat from URL
const downloadUrl = 'https://raw.githubusercontent.com/modmii/modmii.github.io/refs/heads/master/Support/subscripts/DB.bat';
const dbFilePath = path.join(__dirname, 'DB.bat');

console.log('Downloading DB.bat...');

// Download the file
const file = fs.createWriteStream(dbFilePath);
https.get(downloadUrl, (response) => {
  response.pipe(file);

  file.on('finish', () => {
    file.close();
    console.log('Download completed!');

    // Now process the file
    processDBFile();
  });
}).on('error', (err) => {
  fs.unlink(dbFilePath, () => { }); // Delete the file on error
  console.error('Download failed:', err.message);
});

function evaluateVariables(entry) {
  // Keep evaluating until no more substitutions can be made
  let changed = true;
  let iterations = 0;
  const maxIterations = 10; // Prevent infinite loops

  while (changed && iterations < maxIterations) {
    changed = false;
    iterations++;

    for (const key in entry) {
      let value = entry[key];

      // Only process string values that contain variable references
      if (typeof value === 'string' && value.includes('%')) {
        const originalValue = value;

        // Replace all variable references in the format %variableName%
        value = value.replace(/%([^%]+)%/g, (match, varName) => {
          if (entry.hasOwnProperty(varName)) {
            return entry[varName];
          }
          return match; // Keep original if variable not found
        });

        if (value !== originalValue) {
          entry[key] = value;
          changed = true;
        }
      }
    }
  }
}

function processDBFile() {
  const batchContent = fs.readFileSync(dbFilePath, 'utf8');
  const lines = batchContent.split('\n').map(line => line.trim()).filter(line => line);

  const result = {
    meta: {
      DBversion: null,
      converted: new Date().toISOString(),
      source: 'DB.bat',
      creator: "https://github.com/xflak",
      working_categories: [
        'ios',
        'OSC',
      ]
    },
    entries: {}
  };

  let currentEntry = null;
  let inEntry = false;

  for (const line of lines) {
    // Check for DB version at the start
    if (line.startsWith('set DBversion=')) {
      result.meta.DBversion = line.split('=')[1];
      continue;
    }

    // Skip control flow lines, comments, and other non-data lines
    if (line.includes('goto:') ||
      line.includes('if ') ||
      line.includes('call ') ||
      line.includes('move ') ||
      line.includes('exist ') ||
      line.startsWith('::') ||
      line.includes('cls') ||
      line.includes('echo')) {
      continue;
    }

    // Check for entry labels (starting with :)
    if (line.startsWith(':')) {
      const label = line.substring(1);

      // Skip utility labels and comments
      if (['skip', 'DBend'].includes(label) ||
        label.includes(' ') ||
        label.includes(':') ||
        label.includes('Rename') ||
        label.includes('download')) {
        inEntry = false;
        continue;
      }

      currentEntry = label;
      inEntry = true;
      result.entries[currentEntry] = {};
      continue;
    }

    // Process set commands within entries
    if (inEntry && currentEntry && line.startsWith('set ')) {
      let setCommand = line.substring(4); // Remove 'set '

      // Handle quoted set commands like: set "dlname=%code1%.zip"
      if (setCommand.startsWith('"') && setCommand.includes('=') && setCommand.endsWith('"')) {
        setCommand = setCommand.slice(1, -1); // Remove surrounding quotes
      }

      const equalIndex = setCommand.indexOf('=');

      if (equalIndex !== -1) {
        const key = setCommand.substring(0, equalIndex);
        let value = setCommand.substring(equalIndex + 1);

        // Clean up the value
        value = value.replace(/^"|"$/g, ''); // Remove surrounding quotes

        // Handle hex values (keep as strings if they contain letters)
        if (/^[0-9A-Fa-f]+$/.test(value) && value.length > 4) {
          // Keep as string for hex values
        } else if (/^\d+$/.test(value)) {
          // Convert pure numeric values
          value = parseInt(value, 10);
        }

        result.entries[currentEntry][key] = value;
      }
    }
  }

  // Post-process all entries to evaluate variables
  for (const entryKey in result.entries) {
    const entry = result.entries[entryKey];
    evaluateVariables(entry);
  }

  const outputFilePath = path.join(__dirname, 'database.json');
  // Write the JSON file
  fs.writeFileSync(
    outputFilePath,
    JSON.stringify(result, null, 2),
    'utf8'
  );

  console.log('Conversion completed! Output written to database.json');
  console.log(`Converted ${Object.keys(result.entries).length} entries`);
}
