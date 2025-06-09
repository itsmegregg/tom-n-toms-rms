<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\Concept;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Log;

class BranchController extends Controller
{
    public function index()
    {
        try {
            $branches = Branch::with('concept')->get();
            return response()->json($branches);
        } catch (\Exception $e) {
            Log::error('Failed to fetch branches: ' . $e->getMessage());
            return response()->json([
                'error' => 'Failed to fetch branches'
            ], 500);
        }
    }

    public function store(Request $request)
    {
        try {
            Log::info('Branch creation request:', $request->all());
            
            $validated = $request->validate([
                'branch_name' => 'required|string|max:255',
                'branch_description' => 'required|string',
                'branch_address' => 'required|string',
                'concept_id' => 'required|integer|exists:concepts,concept_id'
            ]);

            $branch = Branch::create($validated);
            $branch->load('concept');
            
            return response()->json($branch, 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            Log::warning('Branch validation failed: ' . json_encode($e->errors()));
            return response()->json([
                'error' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Failed to create branch: ' . $e->getMessage());
            return response()->json([
                'error' => 'Failed to create branch: ' . $e->getMessage()
            ], 500);
        }
    }

    public function update(Request $request, $id)
    {
        try {
            $validated = $request->validate([
                'branch_name' => 'required|string|max:255',
                'branch_description' => 'required|string',
                'branch_address' => 'required|string',
                'concept_id' => 'required|integer|exists:concepts,concept_id'
            ]);

            $branch = Branch::findOrFail($id);
            $branch->update($validated);
            $branch->load('concept');
            
            return response()->json($branch);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'error' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Failed to update branch: ' . $e->getMessage());
            return response()->json([
                'error' => 'Failed to update branch'
            ], 500);
        }
    }

    public function destroy($id)
    {
        try {
            $branch = Branch::findOrFail($id);
            $branch->delete();
            return response()->json(null, 204);
        } catch (\Exception $e) {
            Log::error('Failed to delete branch: ' . $e->getMessage());
            return response()->json([
                'error' => 'Failed to delete branch'
            ], 500);
        }
    }
}
