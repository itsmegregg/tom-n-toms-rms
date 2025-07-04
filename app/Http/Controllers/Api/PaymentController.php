<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PaymentDetail;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PaymentController extends Controller
{
    public function getPaymentData(Request $request)
    {
        try {
            $query = PaymentDetail::query()
                ->join('branches', 'payment_details.branch_id', '=', 'branches.branch_id')
                ->join('concepts', 'payment_details.concept_id', '=', 'concepts.concept_id')
                ->select(
                    'payment_details.date',
                    'concepts.concept_name as concept',
                    'branches.branch_name as branch',
                    'payment_details.description',
                    DB::raw('SUM(payment_details.amount) as amount')
                )
                ->whereBetween('payment_details.date', [
                    $request->from_date,
                    $request->to_date
                ])
                ->groupBy(
                    'payment_details.date',
                    'concepts.concept_name',
                    'branches.branch_name',
                    'payment_details.description'
                );

            // Add concept filter if provided
            if ($request->has('concept_id') && $request->concept_id !== 'all') {
                $query->where('payment_details.concept_id', $request->concept_id);
            }

            // Add branch filter if provided
            if ($request->has('branch_id') && $request->branch_id !== 'all') {
                $query->where('payment_details.branch_id', $request->branch_id);
            }

            $data = $query->orderBy('payment_details.date')
                         ->orderBy('concepts.concept_name')
                         ->orderBy('branches.branch_name')
                         ->orderBy('payment_details.description')
                         ->get();

            return response()->json([
                'status' => 'success',
                'data' => $data->map(function ($item) {
                    return [
                        'date' => $item->date,
                        'concept' => $item->concept,
                        'branch' => $item->branch,
                        'description' => $item->description,
                        'amount' => number_format($item->amount, 2)
                    ];
                })
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to fetch payment data: ' . $e->getMessage()
            ], 500);
        }
    }
}
