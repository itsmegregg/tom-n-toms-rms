<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class GovermentDiscountSeeder extends Seeder
{
    public function run(): void
    {
        $data = [
            [
                'branch_id' => 4,
                'concept_id' => 8,
                'date' => '2024-10-01',
                'terminal' => 'T001',
                'id_no' => 'SC-001',
                'id_type' => 'Senior Citizen',
                'name' => 'John Santos',
                'ref_number' => 'REF001',
                'gross_amount' => 1500.50,
                'discount_amount' => 180.06,
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'branch_id' => 4,
                'concept_id' => 8,
                'date' => '2024-10-02',
                'terminal' => 'T002',
                'id_no' => 'PWD-002',
                'id_type' => 'PWD',
                'name' => 'Maria Cruz',
                'ref_number' => 'REF002',
                'gross_amount' => 2300.75,
                'discount_amount' => 276.09,
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'branch_id' => 4,
                'concept_id' => 8,
                'date' => '2024-10-03',
                'terminal' => 'T001',
                'id_no' => 'SC-003',
                'id_type' => 'Senior Citizen',
                'name' => 'Pedro Reyes',
                'ref_number' => 'REF003',
                'gross_amount' => 1800.25,
                'discount_amount' => 216.03,
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'branch_id' => 4,
                'concept_id' => 8,
                'date' => '2024-10-04',
                'terminal' => 'T003',
                'id_no' => 'PWD-004',
                'id_type' => 'PWD',
                'name' => 'Ana Garcia',
                'ref_number' => 'REF004',
                'gross_amount' => 3200.00,
                'discount_amount' => 384.00,
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'branch_id' => 4,
                'concept_id' => 8,
                'date' => '2024-10-05',
                'terminal' => 'T002',
                'id_no' => 'SC-005',
                'id_type' => 'Senior Citizen',
                'name' => 'Roberto Luna',
                'ref_number' => 'REF005',
                'gross_amount' => 2750.50,
                'discount_amount' => 330.06,
                'created_at' => now(),
                'updated_at' => now()
            ],
        ];

        DB::table('goverment_discount')->insert($data);
    }
}
