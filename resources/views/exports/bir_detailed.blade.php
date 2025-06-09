<!DOCTYPE html>
<html>
<head>
    <title>BIR Detailed Report</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            font-size: 12px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }
        th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
        }
        th {
            background-color: #f2f2f2;
        }
        .header {
            text-align: center;
            margin-bottom: 20px;
        }
        .date-range {
            margin-bottom: 10px;
        }
        .text-right {
            text-align: right;
        }
    </style>
</head>
<body>
    <div class="header">
        <h2>BIR Detailed Report</h2>
        <div class="date-range">
            Date Range: {{ date('M d, Y', strtotime($from_date)) }} - {{ date('M d, Y', strtotime($to_date)) }}
        </div>
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
        <tbody>
            @foreach($data as $row)
            <tr>
                <td>{{ $row->branch_name }}</td>
                <td>{{ $row->concept_name }}</td>
                <td>{{ date('M d, Y', strtotime($row->date)) }}</td>
                <td>{{ $row->si_number }}</td>
                <td class="text-right">{{ number_format($row->vat_exempt, 2) }}</td>
                <td class="text-right">{{ number_format($row->vat_zero_rate, 2) }}</td>
                <td class="text-right">{{ number_format($row->vatable_amount, 2) }}</td>
                <td class="text-right">{{ number_format($row->vat_12, 2) }}</td>
                <td class="text-right">{{ number_format($row->less_vat, 2) }}</td>
                <td class="text-right">{{ number_format($row->gross_amount, 2) }}</td>
                <td>{{ $row->discount_type }}</td>
                <td class="text-right">{{ number_format($row->discount_amount, 2) }}</td>
                <td class="text-right">{{ number_format($row->service_charge, 2) }}</td>
                <td class="text-right">{{ number_format($row->takeout_charge, 2) }}</td>
                <td class="text-right">{{ number_format($row->delivery_charge, 2) }}</td>
                <td class="text-right">{{ number_format($row->total_charge, 2) }}</td>
                <td class="text-right">{{ number_format($row->net_total, 2) }}</td>
                <td class="text-right">{{ number_format($row->cash, 2) }}</td>
                <td class="text-right">{{ number_format($row->other_payment, 2) }}</td>
                <td>{{ $row->tx_number }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>
</body>
</html>
