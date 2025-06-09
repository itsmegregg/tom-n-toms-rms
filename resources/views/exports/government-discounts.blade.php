<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Government Discounts Report</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            font-size: 12px;
        }
        .header {
            text-align: center;
            margin-bottom: 20px;
        }
        .date-range {
            text-align: center;
            margin-bottom: 20px;
            font-style: italic;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }
        th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
        }
        th {
            background-color: #f3f4f6;
            font-weight: bold;
        }
        .text-right {
            text-align: right;
        }
        .page-break {
            page-break-after: always;
        }
    </style>
</head>
<body>
    <div class="header">
        <h2>Government Discounts Report</h2>
    </div>

    <div class="date-range">
        Period: {{ \Carbon\Carbon::parse($from_date)->format('M d, Y') }} - {{ \Carbon\Carbon::parse($to_date)->format('M d, Y') }}
    </div>

    <table>
        <thead>
            <tr>
                <th>Branch</th>
                <th>Concept</th>
                <th>Date</th>
                <th>Terminal</th>
                <th>ID No.</th>
                <th>ID Type</th>
                <th>Name</th>
                <th>Ref #</th>
                <th>BER</th>
                <th class="text-right">Gross Amount</th>
                <th class="text-right">Discount Amount</th>
            </tr>
        </thead>
        <tbody>
            @foreach($data as $item)
                <tr>
                    <td>{{ $item->branch_name }}</td>
                    <td>{{ $item->concept_name }}</td>
                    <td>{{ \Carbon\Carbon::parse($item->date)->format('M d, Y') }}</td>
                    <td>{{ $item->terminal }}</td>
                    <td>{{ $item->id_no }}</td>
                    <td>{{ $item->id_type }}</td>
                    <td>{{ $item->name }}</td>
                    <td>{{ $item->ref_number }}</td>
                    <td>{{ $item->ber }}</td>
                    <td class="text-right">{{ number_format($item->gross_amount, 2) }}</td>
                    <td class="text-right">{{ number_format($item->discount_amount, 2) }}</td>
                </tr>
            @endforeach
        </tbody>
        <tfoot>
            <tr>
                <td colspan="9" class="text-right"><strong>Total:</strong></td>
                <td class="text-right"><strong>{{ number_format($data->sum('gross_amount'), 2) }}</strong></td>
                <td class="text-right"><strong>{{ number_format($data->sum('discount_amount'), 2) }}</strong></td>
            </tr>
        </tfoot>
    </table>
</body>
</html>
