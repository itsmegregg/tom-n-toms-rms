<?php

namespace App\Http\Controllers;

use App\Models\Concept;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ConceptController extends Controller
{
    public function index()
    {
        try {
            $concepts = Concept::with('branches')->get();
            return response()->json($concepts);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to fetch concepts'
            ], 500);
        }
    }

    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'concept_name' => 'required|string|max:255',
                'concept_description' => 'required|string'
            ]);

            $concept = Concept::create($validated);
            return response()->json($concept->load('branches'), 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'error' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to create concept'
            ], 500);
        }
    }

    public function update(Request $request, $id)
    {
        try {
            $validated = $request->validate([
                'concept_name' => 'required|string|max:255',
                'concept_description' => 'required|string'
            ]);

            $concept = Concept::findOrFail($id);
            $concept->update($validated);

            return response()->json($concept->load('branches'));
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'error' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to update concept'
            ], 500);
        }
    }

    public function destroy($id)
    {
        try {
            $concept = Concept::findOrFail($id);
            $concept->delete();

            return response()->json(null, 204);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to delete concept'
            ], 500);
        }
    }
}
