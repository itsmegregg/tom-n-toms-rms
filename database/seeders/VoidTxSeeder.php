<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class VoidTxSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $now = Carbon::now();
        $voidTransactions = [];

        // Predefined lists for generating semi-random data
        $terminals = ['TERMINAL-1', 'TERMINAL-2', 'TERMINAL-3', 'TERMINAL-4', 'TERMINAL-5'];
        $cashierNames = [
            'John Smith', 'Emily Davis', 'Michael Johnson', 
            'Sarah Williams', 'David Brown', 'Jessica Miller'
        ];
        $approverNames = [
            'Manager Jones', 'Supervisor Lee', 'Admin Rodriguez', 
            'Director Chen', 'Supervisor Garcia'
        ];
        $remarks = [
            'Duplicate Transaction', 'Customer Request', 
            'Incorrect Pricing', 'System Error', 
            'Refund Issued', 'Cancelled Order'
        ];

        // Generate void transaction records for October 2024
        for ($day = 1; $day <= 31; $day++) {
            // Generate multiple transactions per day (2-5 transactions)
            $transactionsPerDay = rand(2, 5);
            
            for ($i = 0; $i < $transactionsPerDay; $i++) {
                $voidTransactions[] = [
                    'branch_id' => 4,
                    'concept_id' => 8,
                    'date' => Carbon::create(2024, 10, $day)->format('Y-m-d'),
                    'time' => sprintf('%02d:%02d:%02d', rand(0, 23), rand(0, 59), rand(0, 59)),
                    'tx_number' => rand(10000, 99999),
                    'terminal' => $terminals[array_rand($terminals)],
                    'salesinvoice_number' => rand(100000, 999999),
                    'cashier_name' => $cashierNames[array_rand($cashierNames)],
                    'amount' => round(rand(5000, 500000) / 100, 5),
                    'approved_by' => $approverNames[array_rand($approverNames)],
                    'remarks' => $remarks[array_rand($remarks)],
                    'created_at' => $now,
                    'updated_at' => $now
                ];
            }
        }

        // Insert the records in chunks to avoid memory issues
        $chunks = array_chunk($voidTransactions, 25);
        foreach ($chunks as $chunk) {
            DB::table('void_tx')->insert($chunk);
        }
    }
}
