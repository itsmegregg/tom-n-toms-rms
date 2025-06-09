<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use App\Models\Branch;
use App\Models\Concept;
use App\Models\PaymentDetails;

class PaymentDetailsController extends Controller
{
  
    public function store(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'data' => 'required|array',
                'data.*.Branch_name' => 'required|string',
                'data.*.Date' => 'required|date',
                'data.*.Reg' => 'required|string',
                'data.*.Pay_type' => 'nullable|string',
                'data.*.Description' => 'required|string',
                'data.*.Amount' => 'required|numeric',
                'data.*.concept_name' => 'required|string'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $successCount = 0;
            $failedRecords = [];
            $processedRecords = [];

            foreach ($request->data as $record) {
                try {
                    // Find or create branch
                    $branch = Branch::firstOrCreate(
                        ['branch_name' => $record['Branch_name']]
                    );

                    // Find or create concept
                    $concept = Concept::firstOrCreate(
                        ['concept_name' => $record['concept_name']]
                    );

                    // Create or update payment details record
                    $paymentDetails = PaymentDetails::updateOrCreate(
                        [
                            'branch_id' => $branch->branch_id,
                            'concept_id' => $concept->concept_id,
                            'date' => $record['Date'],
                            'reg' => $record['Reg'],
                            'description' => $record['Description']
                        ],
                        [
                            'pay_type' => $record['Pay_type'],
                            'amount' => $record['Amount']
                        ]
                    );

                    $successCount++;
                    $processedRecords[] = [
                        'status' => 'success',
                        'data' => [[
                            'action' => $paymentDetails->wasRecentlyCreated ? 'created' : 'updated',
                            'record_id' => $paymentDetails->payment_id
                        ]]
                    ];

                } catch (\Exception $e) {
                    Log::error('Error processing payment details record:', [
                        'record' => $record,
                        'error' => $e->getMessage()
                    ]);

                    $failedRecords[] = [
                        'record' => $record,
                        'error' => $e->getMessage()
                    ];
                }
            }

            return response()->json([
                'status' => 'success',
                'message' => 'Payment details processed',
                'data' => $processedRecords,
                'summary' => [
                    'success_count' => $successCount,
                    'failed_records' => $failedRecords
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Error in payment details processing:', [
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Error processing payment details',
                'error' => $e->getMessage()
            ], 500);
        }
    }


    public function index(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'date' => 'date',
                'branch_name' => 'string',
                'concept_name' => 'string',
                'reg' => 'string',
                'pay_type' => 'string',
                'receipt_no' => 'string'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $query = PaymentDetails::query()
                ->join('branches', 'payment_details.branch_id', '=', 'branches.branch_id')
                ->join('concepts', 'payment_details.concept_id', '=', 'concepts.concept_id')
                ->select(
                    'payment_details.*',
                    'branches.branch_name',
                    'concepts.concept_name'
                );

            if ($request->has('date')) {
                $query->where('date', $request->date);
            }
            if ($request->has('branch_name')) {
                $query->where('branches.branch_name', $request->branch_name);
            }
            if ($request->has('concept_name')) {
                $query->where('concepts.concept_name', $request->concept_name);
            }
            if ($request->has('reg')) {
                $query->where('reg', $request->reg);
            }
            if ($request->has('pay_type')) {
                $query->where('pay_type', $request->pay_type);
            }
            if ($request->has('receipt_no')) {
                $query->where('receipt_no', $request->receipt_no);
            }

            $payments = $query->get();

            return response()->json([
                'status' => 'success',
                'data' => $payments
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to retrieve payment details records',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    
}
