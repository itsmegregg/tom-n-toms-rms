const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const axios = require('axios');

// Configuration
const CONFIG = {
    sourceDir: 'D:\\RMS\\BIRSUMMARY',
    uploadedDir: 'D:\\RMS\\BIRSUMMARY\\UploadedFiles',
    errorDir: 'D:\\RMS\\BIRSUMMARY\\ErrorFiles',
    apiUrl: 'http://localhost:8000/api/bir-summary', // Updated to match Laravel default port
    filePattern: /^BIRSUMMARY.*\.csv$/i
};

// Ensure directories exist
function ensureDirectories() {
    [CONFIG.sourceDir, CONFIG.uploadedDir, CONFIG.errorDir].forEach(dir => {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
            console.log(`Created directory: ${dir}`);
        }
    });
}

// Process a single CSV file
async function processFile(filePath) {
    const records = [];
    const fileName = path.basename(filePath);
    const errors = [];

    return new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (row) => {
                try {
                    // Transform CSV row to match API format
                    const record = {
                        branch_name: (row.branch_name || '').trim(),
                        concept_name: (row.concept_name || '').trim(),
                        date: row.date,
                        si_first: row.si_first ? parseInt(row.si_first) : null,
                        si_last: row.si_last ? parseInt(row.si_last) : null,
                        beg_amount: row.beg_amount ? parseFloat(row.beg_amount) : null,
                        end_amount: row.end_amount ? parseFloat(row.end_amount) : null,
                        net_amount: row.net_amount ? parseFloat(row.net_amount) : null,
                        sc: row.sc ? parseFloat(row.sc) : null,
                        pwd: row.pwd ? parseFloat(row.pwd) : null,
                        others: row.others ? parseFloat(row.others) : null,
                        returns: row.returns ? parseFloat(row.returns) : null,
                        voids: row.voids ? parseFloat(row.voids) : null,
                        gross_amount: row.gross_amount ? parseFloat(row.gross_amount) : null,
                        vatable: row.vatable ? parseFloat(row.vatable) : null,
                        vat_amount: row.vat_amount ? parseFloat(row.vat_amount) : null,
                        vat_exempt: row.vat_exempt ? parseFloat(row.vat_exempt) : null,
                        zero_rated: row.zero_rated ? parseFloat(row.zero_rated) : null,
                        less_vat: row.less_vat ? parseFloat(row.less_vat) : null,
                        ewt: row.ewt ? parseFloat(row.ewt) : null,
                        service_charge: row.service_charge ? parseFloat(row.service_charge) : null,
                        z_counter: row.z_counter ? parseInt(row.z_counter) : null
                    };

                    // Only validate required fields based on Laravel validation
                    if (!record.branch_name || !record.date) {
                        errors.push(`Row ${records.length + 1}: Missing required fields (branch_name or date)`);
                        return;
                    }

                    records.push(record);
                } catch (error) {
                    errors.push(`Error processing row ${records.length + 1}: ${error.message}`);
                }
            })
            .on('end', async () => {
                if (errors.length > 0) {
                    console.error(`Validation errors in ${fileName}:`);
                    errors.forEach(error => console.error(`- ${error}`));
                }

                if (records.length === 0) {
                    reject(new Error(`No valid records found in ${fileName}`));
                    return;
                }

                // Display the data before sending
                console.log(`\nProcessing ${records.length} records from ${fileName}`);
                console.log('\nSample of data to be sent:');
                console.log(JSON.stringify(records[0], null, 2));

                try {
                    console.log('\nSending data to API...');
                    const response = await axios.post(CONFIG.apiUrl, { data: records }, {
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json'
                        },
                        timeout: 30000 // 30 seconds timeout
                    });
                    
                    if (response.data.status === 'success' || response.data.status === 'partial_success') {
                        console.log(`Successfully processed ${fileName}`);
                        console.log('API Response:', JSON.stringify(response.data, null, 2));
                        
                        if (response.data.status === 'partial_success' && response.data.errors) {
                            console.warn('Some records had errors:', JSON.stringify(response.data.errors, null, 2));
                        }
                        
                        resolve(true);
                    } else {
                        console.error(`API error for ${fileName}:`, response.data.message);
                        if (response.data.errors) {
                            console.error('Validation errors:', JSON.stringify(response.data.errors, null, 2));
                        }
                        reject(new Error(response.data.message));
                    }
                } catch (error) {
                    if (error.response) {
                        console.error(`API error for ${fileName}:`, error.response.data);
                        console.error('Status:', error.response.status);
                        reject(new Error(error.response.data.message || 'API request failed'));
                    } else if (error.request) {
                        console.error(`No response received for ${fileName}`);
                        reject(new Error('No response from server'));
                    } else {
                        console.error(`Error processing ${fileName}:`, error.message);
                        reject(error);
                    }
                }
            })
            .on('error', (error) => {
                console.error(`Error reading ${fileName}:`, error.message);
                reject(error);
            });
    });
}

// Move file to appropriate directory
function moveFile(filePath, success) {
    const fileName = path.basename(filePath);
    const targetDir = success ? CONFIG.uploadedDir : CONFIG.errorDir;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const targetPath = path.join(targetDir, `${path.parse(fileName).name}_${timestamp}${path.parse(fileName).ext}`);
    
    try {
        fs.renameSync(filePath, targetPath);
        console.log(`Moved ${fileName} to ${targetDir}`);
    } catch (error) {
        console.error(`Error moving ${fileName}:`, error.message);
    }
}

// Main process function
async function processBIRSummaryFiles() {
    console.log('Starting BIR Summary files processing...');
    console.log('Configuration:', {
        sourceDir: CONFIG.sourceDir,
        apiUrl: CONFIG.apiUrl,
        filePattern: CONFIG.filePattern.toString()
    });
    
    ensureDirectories();

    try {
        const files = fs.readdirSync(CONFIG.sourceDir);
        const csvFiles = files.filter(file => CONFIG.filePattern.test(file));

        if (csvFiles.length === 0) {
            console.log('No BIR Summary CSV files found to process');
            return;
        }

        console.log(`Found ${csvFiles.length} BIR Summary CSV file(s) to process`);

        for (const file of csvFiles) {
            const filePath = path.join(CONFIG.sourceDir, file);
            console.log(`\nProcessing ${file}...`);

            try {
                const success = await processFile(filePath);
                moveFile(filePath, success);
            } catch (error) {
                console.error(`Failed to process ${file}:`, error.message);
                moveFile(filePath, false);
            }
        }

        console.log('\nCompleted processing all BIR Summary files');
    } catch (error) {
        console.error('Error reading source directory:', error.message);
    }
}

// Start processing
processBIRSummaryFiles().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
