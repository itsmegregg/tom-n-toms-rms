<?php

namespace App\Http\Controllers;

use App\Models\Hourly;
use App\Models\Concept;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class HourlyController extends Controller
{
    public function index(Request $request)
    {
        try {
            $query = Hourly::query()
                ->join('branches', 'hourly.branch_id', '=', 'branches.branch_id')
                ->join('concepts', 'hourly.concept_id', '=', 'concepts.concept_id')
                ->select(
                    'hourly.*',
                    'branches.branch_name',
                    'concepts.concept_name'
                );

            if ($request->has('date')) {
                $query->where('date', $request->date);
            }
            if ($request->has('concept_id')) {
                $query->where('concepts.concept_id', $request->concept_id);
            }

            $hourlyData = $query->orderBy('date')
                ->orderBy('hour')
                ->get();

            $concepts = Concept::select('concept_id', 'concept_name')
                ->orderBy('concept_name')
                ->get();

            Log::info('Hourly data retrieved', [
                'count' => $hourlyData->count(),
                'first_record' => $hourlyData->first(),
                'filters' => $request->all()
            ]);

            return Inertia::render('Hourly/Index', [
                'hourlyData' => $hourlyData,
                'concepts' => $concepts
            ]);
        } catch (\Exception $e) {
            Log::error('Error retrieving hourly data', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return Inertia::render('Hourly/Index', [
                'hourlyData' => [],
                'concepts' => [],
                'error' => 'Failed to retrieve hourly data. Please try again later.'
            ]);
        }
    }

    public function getConcepts()
    {
        try {
            $concepts = Concept::select('concept_id', 'concept_name')
                ->orderBy('concept_name')
                ->get();

            return response()->json($concepts);
        } catch (\Exception $e) {
            Log::error('Error retrieving concepts', [
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'error' => 'Failed to retrieve concepts'
            ], 500);
        }
    }
}
