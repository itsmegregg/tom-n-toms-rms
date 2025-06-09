const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const axios = require('axios');

// Configuration
const config = {
    sourceDir: 'D:\\RMS\\HOURLY',
    uploadedDir: path.join('D:\\RMS\\HOURLY', 'UploadedFiles'),
    errorDir: path.join('D:\\RMS\\HOURLY', 'ErrorFiles'),  // New directory for failed files
    apiEndpoint: 'http://localhost:8000/api/v1/hourly'
};

// Ensure directories exist
[config.uploadedDir, config.errorDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

async function processFile(filePath) {
    const fileName = path.basename(filePath);
    try {
        console.log(`\nProcessing file: ${fileName}`);
        const results = [];
        
        // Parse CSV file and convert to JSON
        await new Promise((resolve, reject) => {
            fs.createReadStream(filePath)
                .pipe(csv({
                    mapValues: ({ header, value }) => {
                        if (value === '') return null;
                        
                        switch(header) {
                            case 'hour':
                            case 'no_tx':
                            case 'no_void':
                                return parseInt(value) || 0;
                            case 'sales_value':
                            case 'discount_amount':
                                return parseFloat(value) || 0.00;
                            default:
                                return value;
                        }
                    }
                }))
                .on('data', (data) => {
                    // Validate required fields
                    if (!data.branch_name || !data.concept_name || !data.date) {
                        console.warn('Skipping row due to missing required fields:', data);
                        return;
                    }

                    const transformedData = {
                        branch_name: data.branch_name.trim(),
                        concept_name: data.concept_name.trim(),
                        date: data.date,
                        hour: data.hour,
                        no_tx: data.no_tx,
                        no_void: data.no_void,
                        sales_value: data.sales_value,
                        discount_amount: data.discount_amount,
                        terminal: data.terminal ? data.terminal.toString() : '1'
                    };
                    results.push(transformedData);
                })
                .on('end', () => resolve(results))
                .on('error', reject);
        });

        if (results.length === 0) {
            throw new Error('No valid records found in file');
        }

        const formattedData = { data: results };

        // Display the converted JSON data
        console.log(`\nConverted ${results.length} records from file:`, fileName);
        
        // Send to API
        const response = await axios.post(config.apiEndpoint, formattedData, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        // Handle different response statuses
        if (response.status === 201 || response.status === 200) {
            // Check if there were any partial failures
            if (response.data.status === 'partial_success') {
                console.log('\nPartially successful upload:');
                console.log(`✓ Successfully processed: ${response.data.data.length} records`);
                console.log(`✗ Failed records: ${response.data.errors.length}`);
                response.data.errors.forEach(error => {
                    console.log(`  - ${error.error} for ${error.branch_name || ''} ${error.concept_name || ''} at hour ${error.hour || ''}`);
                });
                
                // Move to error directory if there were any failures
                const errorPath = path.join(config.errorDir, `ERROR_${fileName}`);
                fs.renameSync(filePath, errorPath);
                console.log(`\nFile moved to error directory: ${errorPath}`);
                return false;
            }

            // Complete success
            const uploadedPath = path.join(config.uploadedDir, fileName);
            fs.renameSync(filePath, uploadedPath);
            console.log(`\n✓ Successfully processed and moved file to: ${uploadedPath}`);
            return true;
        }

        throw new Error(`API returned unexpected status: ${response.status}`);

    } catch (error) {
        console.error(`\n✗ Error processing file ${fileName}:`);
        if (error.response) {
            // API error response
            console.error('API Error:', error.response.data);
        } else if (error.request) {
            // No response received
            console.error('No response received from API. Is the server running?');
        } else {
            // Other errors
            console.error(error.message);
        }

        // Move failed file to error directory
        const errorPath = path.join(config.errorDir, `ERROR_${fileName}`);
        fs.renameSync(filePath, errorPath);
        console.log(`File moved to error directory: ${errorPath}`);
        return false;
    }
}

async function processHourlyFiles() {
    try {
        console.log('\n=== Starting hourly file processing ===\n');
        
        // Read all files in the source directory
        const files = fs.readdirSync(config.sourceDir);
        
        // Filter files that start with "HOURLY"
        const hourlyFiles = files.filter(file => 
            file.startsWith('HOURLY') && 
            path.extname(file).toLowerCase() === '.csv' &&
            fs.statSync(path.join(config.sourceDir, file)).isFile()
        );

        if (hourlyFiles.length === 0) {
            console.log('No hourly CSV files found to process');
            return;
        }

        console.log(`Found ${hourlyFiles.length} hourly files to process`);

        // Process each file
        let successful = 0;
        let failed = 0;

        for (const file of hourlyFiles) {
            const result = await processFile(path.join(config.sourceDir, file));
            if (result) successful++; else failed++;
        }

        console.log('\n=== Processing Summary ===');
        console.log(`✓ Successfully processed: ${successful} files`);
        console.log(`✗ Failed: ${failed} files`);
        console.log('\nProcess completed!\n');

    } catch (error) {
        console.error('\nFatal error:', error.message);
        process.exit(1);
    }
}

// Run the process
processHourlyFiles();
