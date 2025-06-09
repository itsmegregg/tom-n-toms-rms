<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class GovermentDiscountSecondBatchSeeder extends Seeder
{
    public function run(): void
    {
        $data = [
            // October 6
            [
                'branch_id' => 4,
                'concept_id' => 8,
                'date' => '2024-10-06',
                'terminal' => 'T001',
                'id_no' => 'SC-006A',
                'id_type' => 'Senior Citizen',
                'name' => 'Elena Santos',
                'ref_number' => 'REF006A',
                'gross_amount' => 1850.75,
                'discount_amount' => 222.09,
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'branch_id' => 4,
                'concept_id' => 8,
                'date' => '2024-10-06',
                'terminal' => 'T002',
                'id_no' => 'PWD-006B',
                'id_type' => 'PWD',
                'name' => 'Ramon Dela Cruz',
                'ref_number' => 'REF006B',
                'gross_amount' => 2100.50,
                'discount_amount' => 252.06,
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'branch_id' => 4,
                'concept_id' => 8,
                'date' => '2024-10-06',
                'terminal' => 'T003',
                'id_no' => 'SC-006C',
                'id_type' => 'Senior Citizen',
                'name' => 'Carmen Reyes',
                'ref_number' => 'REF006C',
                'gross_amount' => 3300.25,
                'discount_amount' => 396.03,
                'created_at' => now(),
                'updated_at' => now()
            ],
            // October 7
            [
                'branch_id' => 4,
                'concept_id' => 8,
                'date' => '2024-10-07',
                'terminal' => 'T001',
                'id_no' => 'PWD-007A',
                'id_type' => 'PWD',
                'name' => 'Marco Lopez',
                'ref_number' => 'REF007A',
                'gross_amount' => 1750.50,
                'discount_amount' => 210.06,
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'branch_id' => 4,
                'concept_id' => 8,
                'date' => '2024-10-07',
                'terminal' => 'T002',
                'id_no' => 'SC-007B',
                'id_type' => 'Senior Citizen',
                'name' => 'Rosa Martinez',
                'ref_number' => 'REF007B',
                'gross_amount' => 2800.75,
                'discount_amount' => 336.09,
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'branch_id' => 4,
                'concept_id' => 8,
                'date' => '2024-10-07',
                'terminal' => 'T003',
                'id_no' => 'PWD-007C',
                'id_type' => 'PWD',
                'name' => 'Felipe Torres',
                'ref_number' => 'REF007C',
                'gross_amount' => 1950.25,
                'discount_amount' => 234.03,
                'created_at' => now(),
                'updated_at' => now()
            ],
            // October 8
            [
                'branch_id' => 4,
                'concept_id' => 8,
                'date' => '2024-10-08',
                'terminal' => 'T001',
                'id_no' => 'SC-008A',
                'id_type' => 'Senior Citizen',
                'name' => 'Linda Garcia',
                'ref_number' => 'REF008A',
                'gross_amount' => 2250.50,
                'discount_amount' => 270.06,
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'branch_id' => 4,
                'concept_id' => 8,
                'date' => '2024-10-08',
                'terminal' => 'T002',
                'id_no' => 'PWD-008B',
                'id_type' => 'PWD',
                'name' => 'Pablo Ramos',
                'ref_number' => 'REF008B',
                'gross_amount' => 3100.75,
                'discount_amount' => 372.09,
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'branch_id' => 4,
                'concept_id' => 8,
                'date' => '2024-10-08',
                'terminal' => 'T003',
                'id_no' => 'SC-008C',
                'id_type' => 'Senior Citizen',
                'name' => 'Teresa Luna',
                'ref_number' => 'REF008C',
                'gross_amount' => 1650.25,
                'discount_amount' => 198.03,
                'created_at' => now(),
                'updated_at' => now()
            ],
            // October 9
            [
                'branch_id' => 4,
                'concept_id' => 8,
                'date' => '2024-10-09',
                'terminal' => 'T001',
                'id_no' => 'PWD-009A',
                'id_type' => 'PWD',
                'name' => 'Carlos Mendoza',
                'ref_number' => 'REF009A',
                'gross_amount' => 2450.50,
                'discount_amount' => 294.06,
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'branch_id' => 4,
                'concept_id' => 8,
                'date' => '2024-10-09',
                'terminal' => 'T002',
                'id_no' => 'SC-009B',
                'id_type' => 'Senior Citizen',
                'name' => 'Victoria Santos',
                'ref_number' => 'REF009B',
                'gross_amount' => 3400.75,
                'discount_amount' => 408.09,
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'branch_id' => 4,
                'concept_id' => 8,
                'date' => '2024-10-09',
                'terminal' => 'T003',
                'id_no' => 'PWD-009C',
                'id_type' => 'PWD',
                'name' => 'Manuel Cruz',
                'ref_number' => 'REF009C',
                'gross_amount' => 1850.25,
                'discount_amount' => 222.03,
                'created_at' => now(),
                'updated_at' => now()
            ],
            // October 10
            [
                'branch_id' => 4,
                'concept_id' => 8,
                'date' => '2024-10-10',
                'terminal' => 'T001',
                'id_no' => 'SC-010A',
                'id_type' => 'Senior Citizen',
                'name' => 'Isabella Reyes',
                'ref_number' => 'REF010A',
                'gross_amount' => 2650.50,
                'discount_amount' => 318.06,
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'branch_id' => 4,
                'concept_id' => 8,
                'date' => '2024-10-10',
                'terminal' => 'T002',
                'id_no' => 'PWD-010B',
                'id_type' => 'PWD',
                'name' => 'Ricardo Luna',
                'ref_number' => 'REF010B',
                'gross_amount' => 3200.75,
                'discount_amount' => 384.09,
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'branch_id' => 4,
                'concept_id' => 8,
                'date' => '2024-10-10',
                'terminal' => 'T003',
                'id_no' => 'SC-010C',
                'id_type' => 'Senior Citizen',
                'name' => 'Diana Santos',
                'ref_number' => 'REF010C',
                'gross_amount' => 1950.25,
                'discount_amount' => 234.03,
                'created_at' => now(),
                'updated_at' => now()
            ],
        ];

        DB::table('goverment_discount')->insert($data);
    }
}
