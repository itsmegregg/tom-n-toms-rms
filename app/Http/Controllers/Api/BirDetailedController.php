<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Branch;
use App\Models\Concept;
use App\Models\BirDetailed;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class BirDetailedController extends Controller
{
    public function store(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'data' => 'required|array',
                'data.*.branch_name' => 'required|string',
                'data.*.date' => 'required|date',
                'data.*.concept_name' => 'required|string',
                'data.*.si_number' => 'required|integer',
                'data.*.vat_exempt' => 'nullable|numeric',
                'data.*.vat_zero_rate' => 'nullable|numeric',
                'data.*.vatable_amount' => 'nullable|numeric',
                'data.*.vat_12' => 'nullable|numeric',
                'data.*.less_vat' => 'nullable|numeric',
                'data.*.gross_amount' => 'nullable|numeric',
                'data.*.discount_type' => 'nullable|string|max:50',
                'data.*.discount_amount' => 'nullable|numeric',
                'data.*.service_charge' => 'required|numeric',
                'data.*.takeout_charge' => 'required|numeric',
                'data.*.delivery_charge' => 'required|numeric',
                'data.*.total_charge' => 'nullable|numeric',
                'data.*.net_total' => 'nullable|numeric',
                'data.*.cash' => 'nullable|numeric',
                'data.*.other_payment' => 'nullable|numeric',
                'data.*.tx_number' => 'required|integer'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            DB::beginTransaction();

            $successCount = 0;
            $errors = [];
            $lastAction = null;

            foreach ($request->data as $index => $record) {
                try {
                    // Find the branch (case-insensitive)
                    $branch = Branch::whereRaw('LOWER(branch_name) = ?', [strtolower($record['branch_name'])])->first();
                    if (!$branch) {
                        $errors[] = [
                            'index' => $index,
                            'branch_name' => $record['branch_name'],
                            'error' => 'Branch not found'
                        ];
                        continue;
                    }

                    // Find the concept (case-insensitive)
                    $concept = Concept::whereRaw('LOWER(concept_name) = ?', [strtolower($record['concept_name'])])->first();
                    if (!$concept) {
                        $errors[] = [
                            'index' => $index,
                            'concept_name' => $record['concept_name'],
                            'error' => 'Concept not found'
                        ];
                        continue;
                    }

                    // Check if record exists
                    $birDetailed = BirDetailed::where([
                        'branch_id' => $branch->branch_id,
                        'concept_id' => $concept->concept_id,
                        'date' => $record['date'],
                        'si_number' => $record['si_number']
                    ])->first();

                    $recordData = [
                        'branch_id' => $branch->branch_id,
                        'concept_id' => $concept->concept_id,
                        'date' => $record['date'],
                        'si_number' => $record['si_number'],
                        'vat_exempt' => $record['vat_exempt'] ?? 0.00,
                        'vat_zero_rate' => $record['vat_zero_rate'] ?? 0.00,
                        'vatable_amount' => $record['vatable_amount'] ?? 0.00,
                        'vat_12' => $record['vat_12'] ?? 0.00,
                        'less_vat' => $record['less_vat'] ?? 0.00,
                        'gross_amount' => $record['gross_amount'] ?? 0.00,
                        'discount_type' => $record['discount_type'],
                        'discount_amount' => $record['discount_amount'] ?? 0.00,
                        'service_charge' => $record['service_charge'] ?? 0.00000,
                        'takeout_charge' => $record['takeout_charge'] ?? 0.00000,
                        'delivery_charge' => $record['delivery_charge'] ?? 0.00000,
                        'total_charge' => $record['total_charge'] ?? 0.00,
                        'net_total' => $record['net_total'] ?? 0.00,
                        'cash' => $record['cash'] ?? 0.00,
                        'other_payment' => $record['other_payment'] ?? 0.00,
                        'tx_number' => $record['tx_number']
                    ];

                    if ($birDetailed) {
                        // Update existing record
                        $birDetailed->update($recordData);
                        $lastAction = 'updated';
                    } else {
                        // Create new record
                        BirDetailed::create($recordData);
                        $lastAction = 'created';
                    }

                    $successCount++;
                } catch (\Exception $e) {
                    $errors[] = [
                        'index' => $index,
                        'error' => 'Failed to process record: ' . $e->getMessage()
                    ];
                }
            }

            DB::commit();

            $status = $errors ? ($successCount > 0 ? 'partial_success' : 'error') : 'success';
            $message = $successCount . ' records processed successfully';
            if ($errors) {
                $message .= ', ' . count($errors) . ' records failed';
            }

            return response()->json([
                'status' => $status,
                'message' => $message,
                'data' => array_fill(0, $successCount, true),
                'errors' => $errors,
                'action' => $lastAction ?? 'processed'
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to process records: ' . $e->getMessage()
            ], 500);
        }
    }

    public function index(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'branch_id' => 'required|string',
                'concept_id' => 'nullable|string',
                'from_date' => 'required|date',
                'to_date' => 'required|date',
                'per_page' => 'nullable|integer|min:1',
                'page' => 'nullable|integer|min:1'
            ]);
            if ($validator->fails()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $query = BirDetailed::query()
                ->join('branches', 'bir_detailed.branch_id', '=', 'branches.branch_id')
                ->join('concepts', 'bir_detailed.concept_id', '=', 'concepts.concept_id')
                ->whereBetween('date', [$request->from_date, $request->to_date])
                ->select(
                    'bir_detailed.*',
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
           
            $perPage = $request->input('per_page', 10);
            $birDetailed = $query->paginate($perPage);

            return response()->json([
                'status' => 'success',
                'data' => $birDetailed->items(),
                'pagination' => [
                    'current_page' => $birDetailed->currentPage(),
                    'per_page' => $birDetailed->perPage(),
                    'total' => $birDetailed->total(),
                    'last_page' => $birDetailed->lastPage()
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to fetch BIR detailed data: ' . $e->getMessage()
            ], 500);
        }
    }

    public function exportExcel(Request $request)
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

            $query = BirDetailed::query()
                ->join('branches', 'bir_detailed.branch_id', '=', 'branches.branch_id')
                ->join('concepts', 'bir_detailed.concept_id', '=', 'concepts.concept_id')
                ->whereBetween('date', [$request->from_date, $request->to_date])
                ->select(
                    'branches.branch_name',
                    'concepts.concept_name',
                    'bir_detailed.date',
                    'bir_detailed.si_number',
                    'bir_detailed.vat_exempt',
                    'bir_detailed.vat_zero_rate',
                    'bir_detailed.vatable_amount',
                    'bir_detailed.vat_12',
                    'bir_detailed.less_vat',
                    'bir_detailed.gross_amount',
                    'bir_detailed.discount_type',
                    'bir_detailed.discount_amount',
                    'bir_detailed.service_charge',
                    'bir_detailed.takeout_charge',
                    'bir_detailed.delivery_charge',
                    'bir_detailed.total_charge',
                    'bir_detailed.net_total',
                    'bir_detailed.cash',
                    'bir_detailed.other_payment',
                    'bir_detailed.tx_number'
                );

            if ($request->branch_id !== 'all') {
                $query->where('branches.branch_id', $request->branch_id);
            }
            if ($request->concept_id !== 'all') {
                $query->where('concepts.concept_id', $request->concept_id);
            }

            $data = $query->get();

            $filename = 'bir_detailed_report_' . date('Y-m-d') . '.csv';
            $handle = fopen('php://temp', 'r+');
            
            // Add BOM for Excel to properly detect UTF-8
            fputs($handle, "\xEF\xBB\xBF");

            // Add headers
            fputcsv($handle, [
                'Branch',
                'Concept',
                'Date',
                'SI Number',
                'VAT Exempt',
                'VAT Zero Rate',
                'Vatable Amount',
                'VAT 12%',
                'Less VAT',
                'Gross Amount',
                'Discount Type',
                'Discount Amount',
                'Service Charge',
                'Takeout Charge',
                'Delivery Charge',
                'Total Charge',
                'Net Total',
                'Cash',
                'Other Payment',
                'TX Number'
            ]);

            // Add data rows
            foreach ($data as $row) {
                fputcsv($handle, [
                    $row->branch_name,
                    $row->concept_name,
                    $row->date,
                    $row->si_number,
                    number_format($row->vat_exempt, 2),
                    number_format($row->vat_zero_rate, 2),
                    number_format($row->vatable_amount, 2),
                    number_format($row->vat_12, 2),
                    number_format($row->less_vat, 2),
                    number_format($row->gross_amount, 2),
                    $row->discount_type,
                    number_format($row->discount_amount, 2),
                    number_format($row->service_charge, 2),
                    number_format($row->takeout_charge, 2),
                    number_format($row->delivery_charge, 2),
                    number_format($row->total_charge, 2),
                    number_format($row->net_total, 2),
                    number_format($row->cash, 2),
                    number_format($row->other_payment, 2),
                    $row->tx_number
                ]);
            }

            rewind($handle);
            $content = stream_get_contents($handle);
            fclose($handle);

            return response($content)
                ->header('Content-Type', 'text/csv; charset=UTF-8')
                ->header('Content-Disposition', 'attachment; filename="' . $filename . '"');

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to export Excel: ' . $e->getMessage()
            ], 500);
        }
    }

    public function exportPdf(Request $request)
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

            $query = BirDetailed::query()
                ->join('branches', 'bir_detailed.branch_id', '=', 'branches.branch_id')
                ->join('concepts', 'bir_detailed.concept_id', '=', 'concepts.concept_id')
                ->whereBetween('date', [$request->from_date, $request->to_date])
                ->select(
                    'branches.branch_name',
                    'concepts.concept_name',
                    'bir_detailed.date',
                    'bir_detailed.si_number',
                    'bir_detailed.vat_exempt',
                    'bir_detailed.vat_zero_rate',
                    'bir_detailed.vatable_amount',
                    'bir_detailed.vat_12',
                    'bir_detailed.less_vat',
                    'bir_detailed.gross_amount',
                    'bir_detailed.discount_type',
                    'bir_detailed.discount_amount',
                    'bir_detailed.service_charge',
                    'bir_detailed.takeout_charge',
                    'bir_detailed.delivery_charge',
                    'bir_detailed.total_charge',
                    'bir_detailed.net_total',
                    'bir_detailed.cash',
                    'bir_detailed.other_payment',
                    'bir_detailed.tx_number'
                );

            if ($request->branch_id !== 'all') {
                $query->where('branches.branch_id', $request->branch_id);
            }
            if ($request->concept_id !== 'all') {
                $query->where('concepts.concept_id', $request->concept_id);
            }

            $data = $query->get();

            $html = '<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>BIR Detailed Report</title>
    <style>
        body { font-family: Arial, sans-serif; font-size: 12px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f5f5f5; }
        .text-right { text-align: right; }
        .report-header { margin-bottom: 20px; }
        .report-header h2 { margin: 0; }
        .report-header p { margin: 5px 0; }
        .numeric { text-align: right; }
    </style>
</head>
<body>
    <div class="report-header">
        <h2>BIR Detailed Report</h2>
        <p>Date Range: ' . date('M d, Y', strtotime($request->from_date)) . ' - ' . date('M d, Y', strtotime($request->to_date)) . '</p>
    </div>
    <table>
        <thead>
            <tr>
                <th>Branch</th>
                <th>Concept</th>
                <th>Date</th>
                <th>SI #</th>
                <th>VAT Exempt</th>
                <th>VAT Zero Rate</th>
                <th>Vatable Amount</th>
                <th>VAT 12%</th>
                <th>Less VAT</th>
                <th>Gross Amount</th>
                <th>Discount Type</th>
                <th>Discount Amount</th>
                <th>Service Charge</th>
                <th>Takeout Charge</th>
                <th>Delivery Charge</th>
                <th>Total Charge</th>
                <th>Net Total</th>
                <th>Cash</th>
                <th>Other Payment</th>
                <th>TX #</th>
            </tr>
        </thead>
        <tbody>';

            foreach ($data as $row) {
                $html .= '<tr>
                    <td>' . htmlspecialchars($row->branch_name) . '</td>
                    <td>' . htmlspecialchars($row->concept_name) . '</td>
                    <td>' . date('M d, Y', strtotime($row->date)) . '</td>
                    <td>' . htmlspecialchars($row->si_number) . '</td>
                    <td class="numeric">' . number_format($row->vat_exempt, 2) . '</td>
                    <td class="numeric">' . number_format($row->vat_zero_rate, 2) . '</td>
                    <td class="numeric">' . number_format($row->vatable_amount, 2) . '</td>
                    <td class="numeric">' . number_format($row->vat_12, 2) . '</td>
                    <td class="numeric">' . number_format($row->less_vat, 2) . '</td>
                    <td class="numeric">' . number_format($row->gross_amount, 2) . '</td>
                    <td>' . htmlspecialchars($row->discount_type) . '</td>
                    <td class="numeric">' . number_format($row->discount_amount, 2) . '</td>
                    <td class="numeric">' . number_format($row->service_charge, 2) . '</td>
                    <td class="numeric">' . number_format($row->takeout_charge, 2) . '</td>
                    <td class="numeric">' . number_format($row->delivery_charge, 2) . '</td>
                    <td class="numeric">' . number_format($row->total_charge, 2) . '</td>
                    <td class="numeric">' . number_format($row->net_total, 2) . '</td>
                    <td class="numeric">' . number_format($row->cash, 2) . '</td>
                    <td class="numeric">' . number_format($row->other_payment, 2) . '</td>
                    <td>' . htmlspecialchars($row->tx_number) . '</td>
                </tr>';
            }

            $html .= '</tbody></table></body></html>';

            $filename = 'bir_detailed_report_' . date('Y-m-d') . '.html';

            return response($html)
                ->header('Content-Type', 'text/html')
                ->header('Content-Disposition', 'attachment; filename="' . $filename . '"');

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to export PDF: ' . $e->getMessage()
            ], 500);
        }
    }
}
