<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Branch;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class BranchController extends Controller
{
    public function index(Request $request)
    {
        try {
            $query = Branch::select('branch_id', 'branch_name', 'concept_id');

            if ($request->has('concept_id')) {
                $query->where('concept_id', $request->concept_id);
            }

            $branches = $query->orderBy('branch_name')->get();

            return response()->json([
                'data' => $branches
            ]);
        } catch (\Exception $e) {
            Log::error('Error retrieving branches', [
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'error' => 'Failed to retrieve branches'
            ], 500);
        }
    }
}
