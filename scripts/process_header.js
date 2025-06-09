const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const axios = require('axios');

// Configuration
const CONFIG = {
    sourceDir: 'D:\\RMS\\HEADER',
    uploadedDir: 'D:\\RMS\\HEADER\\UploadedFiles',
    errorDir: 'D:\\RMS\\HEADER\\ErrorFiles',
    apiUrl: 'http://localhost:8000/api/v1/header',
    filePattern: /^HEADER.*\.csv$/i
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

    return new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (row) => {
                // Transform CSV row to match API format
                const record = {
                    branch_name: (row.branch_name || '').trim(),
                    concept_name: (row.concept_name || '').trim(),
                    date: row.date,
                    reg: (row.reg || '').trim(),
                    or_from: (row.or_from || '').trim(),
                    or_to: (row.or_to || '').trim(),
                    beg_balance: parseFloat(row.beg_balance || 0),
                    end_balance: parseFloat(row.end_balance || 0),
                    no_transaction: parseInt(row.no_transaction || 0),
                    no_guest: parseInt(row.no_guest || 0),
                    reg_guest: parseInt(row.reg_guest || 0),
                    ftime_guest: parseInt(row.ftime_guest || 0),
                    no_void: parseInt(row.no_void || 0),
                    no_disc: parseInt(row.no_disc || 0),
                    other_disc: parseFloat(row.other_disc || 0),
                    senior_disc: parseFloat(row.senior_disc || 0),
                    pwd_disc: parseFloat(row.pwd_disc || 0),
                    open_disc: parseFloat(row.open_disc || 0),
                    vip_disc: parseFloat(row.vip_disc || 0),
                    employee_disc: parseFloat(row.employee_disc || 0),
                    promo_disc: parseFloat(row.promo_disc || 0),
                    free_disc: parseFloat(row.free_disc || 0),
                    no_cancel: parseInt(row.no_cancel || 0),
                    room_charge: parseFloat(row.room_charge || 0),
                    z_count: (row.z_count || '').trim()
                };

                // Basic validation
                if (!record.branch_name || !record.concept_name || !record.date) {
                    console.error(`Skipping row in ${fileName}: Missing required fields`);
                    return;
                }

                records.push(record);
            })
            .on('end', async () => {
                if (records.length === 0) {
                    reject(new Error(`No valid records found in ${fileName}`));
                    return;
                }

                try {
                    const response = await axios.post(CONFIG.apiUrl, { data: records });
                    
                    // Handle partial success
                    if (response.data.status === 'partial_success') {
                        console.log(`Partial success for ${fileName}:`);
                        console.log('Successful records:', response.data.data.length);
                        console.log('Failed records:', response.data.errors.length);
                        response.data.errors.forEach(error => {
                            console.log(`- Error at index ${error.index}: ${error.error}`);
                        });
                    }

                    resolve({
                        success: true,
                        fileName,
                        message: response.data.message,
                        recordCount: records.length
                    });
                } catch (error) {
                    const errorMessage = error.response?.data?.message || error.message;
                    reject(new Error(`API Error for ${fileName}: ${errorMessage}`));
                }
            })
            .on('error', (error) => {
                reject(new Error(`CSV Parse Error for ${fileName}: ${error.message}`));
            });
    });
}

// Move file to appropriate directory
function moveFile(filePath, success) {
    const fileName = path.basename(filePath);
    const targetDir = success ? CONFIG.uploadedDir : CONFIG.errorDir;
    const targetPath = path.join(targetDir, success ? fileName : `ERROR_${fileName}`);
    
    try {
        fs.renameSync(filePath, targetPath);
        console.log(`Moved ${fileName} to ${targetDir}`);
    } catch (error) {
        console.error(`Failed to move ${fileName}: ${error.message}`);
    }
}

// Main process function
async function processHeaderFiles() {
    console.log('Starting header file processing...');
    ensureDirectories();

    const files = fs.readdirSync(CONFIG.sourceDir)
        .filter(file => CONFIG.filePattern.test(file))
        .map(file => path.join(CONFIG.sourceDir, file));

    if (files.length === 0) {
        console.log('No header files found to process');
        return;
    }

    console.log(`Found ${files.length} header files to process`);

    for (const filePath of files) {
        const fileName = path.basename(filePath);
        console.log(`\nProcessing ${fileName}...`);

        try {
            const result = await processFile(filePath);
            console.log(`Success: ${fileName} - ${result.recordCount} records processed`);
            moveFile(filePath, true);
        } catch (error) {
            console.error(`Error processing ${fileName}:`, error.message);
            moveFile(filePath, false);
        }
    }

    console.log('\nHeader file processing completed!');
}

// Start processing
processHeaderFiles().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
