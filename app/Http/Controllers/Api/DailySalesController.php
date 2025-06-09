<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;

class DailySalesController extends Controller
{
    public function index(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'branch_id' => 'required|string',
                'concept_id' => 'nullable|string',
                'from_date' => 'required|date',
                'to_date' => 'required|date'
            ]);            

            if ($validator->fails()) {    
                return response()->json([
                    'status' => 'error',
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $query = DB::table('hourly')
                ->join('branches', 'hourly.branch_id', '=', 'branches.branch_id')
                ->join('concepts', 'branches.concept_id', '=', 'concepts.concept_id')
                ->whereBetween('hourly.date', [$request->from_date, $request->to_date]);            

            if ($request->filled('branch_id') && $request->branch_id !== 'ALL') {
                $query->where('hourly.branch_id', $request->branch_id);            
            }

            if ($request->filled('concept_id') && $request->concept_id !== 'ALL') {
                $query->where('concepts.concept_id', $request->concept_id);
            }

            $dailySales = $query->select(
                'hourly.*',
                'branches.branch_name',
                'concepts.concept_name'
            )
            ->orderBy('hourly.date')
            ->orderBy('hourly.hour')
            ->get();

            return response()->json([
                'status' => 'success',
                'data' => $dailySales
            ], 200);

        } catch (\Exception $e) {
            Log::error('Error retrieving daily sales', [            
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Failed to retrieve daily sales',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}