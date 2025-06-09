<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Concept;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class ConceptController extends Controller
{
    public function index()
    {
        try {
            $concepts = Concept::select('concept_id', 'concept_name')
                ->orderBy('concept_name')
                ->get();

            return response()->json([
                'data' => $concepts
            ]);
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
