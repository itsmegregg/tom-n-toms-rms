<?php

namespace App\Http\Controllers;

use App\Models\Category;
use Illuminate\Http\Request;
use Inertia\Inertia;
use League\Csv\Reader;

class CategoryController extends Controller
{
    public function index()
    {
        $categories = Category::all();
        return response()->json($categories);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'category_code' => 'required|string|max:255',
            'category_desc' => 'required|string'
        ]);

        $category = Category::create($validated);
        return response()->json($category, 201);
    }

    public function importCsv(Request $request)
    {
        try {
            $request->validate([
                'csv_file' => 'required|file|mimes:csv,txt|max:10240'
            ]);

            $file = $request->file('csv_file');
            if (!$file->isValid()) {
                return response()->json(['error' => 'Invalid file upload'], 422);
            }

            $csv = Reader::createFromPath($file->getPathname(), 'r');
            $csv->setHeaderOffset(0);
            $csv->setDelimiter(',');

            $headers = $csv->getHeader();
            if (!in_array('category_code', $headers) || !in_array('category_desc', $headers)) {
                return response()->json([
                    'error' => 'CSV file must contain category_code and category_desc columns. Found columns: ' . implode(', ', $headers)
                ], 422);
            }

            $records = $csv->getRecords();
            $imported = 0;
            $errors = [];

            \Log::info('Starting CSV import');
            \Log::info('File headers: ' . implode(', ', $headers));

            foreach ($records as $index => $record) {
                try {
                    if (empty($record['category_code']) || empty($record['category_desc'])) {
                        throw new \Exception('Both category_code and category_desc are required');
                    }

                    \Log::info('Importing row ' . ($index + 1), $record);

                    $category = Category::create([
                        'category_code' => trim($record['category_code']),
                        'category_desc' => trim($record['category_desc'])
                    ]);

                    \Log::info('Created category', ['id' => $category->id]);
                    $imported++;
                } catch (\Exception $e) {
                    $errors[] = "Row " . ($index + 1) . ": " . $e->getMessage();
                    \Log::error('Error importing row ' . ($index + 1), [
                        'error' => $e->getMessage(),
                        'record' => $record
                    ]);
                }
            }

            if (count($errors) > 0) {
                \Log::warning('Import completed with errors', ['errors' => $errors]);
                return response()->json(['error' => 'Import completed with errors: ' . implode(', ', $errors)], 422);
            }

            if ($imported === 0) {
                \Log::warning('No records were imported');
                return response()->json(['error' => 'No records were imported. Please check your CSV file format.'], 422);
            }

            \Log::info('Import completed successfully', ['imported' => $imported]);
            return response()->json(['message' => $imported . ' categories imported successfully']);
        } catch (\Exception $e) {
            \Log::error('Import failed', ['error' => $e->getMessage()]);
            return response()->json(['error' => 'Error importing categories: ' . $e->getMessage()], 500);
        }
    }

    public function update(Request $request, Category $category)
    {
        $validated = $request->validate([
            'category_code' => 'required|string|max:255',
            'category_desc' => 'required|string'
        ]);

        $category->update($validated);

        return redirect()->back()->with('success', 'Category updated successfully');
    }

    public function updateCategory(Request $request, $id)
    {
        try {
            $request->validate([
                'category_code' => 'required|string|max:50',
                'category_desc' => 'required|string|max:255',
            ]);

            $category = Category::findOrFail($id);
            
            // Check if another category with the same code exists (excluding current category)
            $existingCategory = Category::where('category_code', $request->category_code)
                ->where('id', '!=', $id)
                ->first();
                
            if ($existingCategory) {
                return response()->json([
                    'error' => 'Category code already exists'
                ], 422);
            }

            $category->update([
                'category_code' => $request->category_code,
                'category_desc' => $request->category_desc,
            ]);

            return response()->json($category);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'error' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to update category'
            ], 500);
        }
    }

    public function destroy(Category $category)
    {
        $category->delete();
        return response()->json(null, 204);
    }
    
}
