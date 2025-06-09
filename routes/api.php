<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\HourlyController;
use App\Http\Controllers\Api\HeaderController;
use App\Http\Controllers\Api\ItemSalesController;
use App\Http\Controllers\Api\PaymentDetailsController;
use App\Http\Controllers\Api\BirDetailedController;
use App\Http\Controllers\Api\BirSummaryController;
use App\Http\Controllers\Api\ConceptController;
use App\Http\Controllers\Api\BranchController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\DailySalesController;
use App\Http\Controllers\Api\GovernmentDiscountController;
use App\Http\Controllers\Api\VoidTxController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\CashierController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\Api\ProductController;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

// Hourly Sales API Routes
Route::prefix('v1')->group(function () {
    Route::post('/hourly', [HourlyController::class, 'store']);
    Route::get('/hourly', [HourlyController::class, 'index']);
    
    // Header API Routes
    Route::post('/header', [HeaderController::class, 'store']);
    Route::get('/header', [HeaderController::class, 'index']);

    // Item Sales API Routes
    Route::post('/item-sales', [ItemSalesController::class, 'store']);
    Route::get('/item-sales', [ItemSalesController::class, 'index']);
    Route::get('/item-sales/discount-report', [ItemSalesController::class, 'discountReport']);
    Route::get('/item-sales/fast-moving', [ItemSalesController::class, 'getFastMovingItem']);

    // Payment Details API Routes
    Route::post('/payment-details', [PaymentDetailsController::class, 'store']);
    Route::get('/payment-details', [PaymentDetailsController::class, 'index']);

    // BIR Detailed API Routes
    Route::post('/bir-detailed', [BirDetailedController::class, 'store']);
    Route::get('/bir-detailed', [BirDetailedController::class, 'index']);

    Route::get('/payment', [PaymentController::class, 'getPaymentData']);

    Route::get('/concepts' , [ConceptController::class, 'index']);
    Route::get('/branches' , [BranchController::class, 'index']);
    
    Route::post('/government-discounts', [GovernmentDiscountController::class, 'store']);
    Route::get('/government-discounts', [GovernmentDiscountController::class, 'index']);

    
    // Void Transaction API Routes
    Route::get('/void-tx', [VoidTxController::class, 'index']);
    Route::post('/void-tx', [VoidTxController::class, 'store']);
    Route::get('/void-tx/search', [VoidTxController::class, 'search']);

    // Cashier API Routes
    Route::post('/cashier', [CashierController::class, 'store']);
    Route::get('/cashier-report', [CashierController::class, 'index']);

   

    Route::get('/daily-sales', [DailySalesController::class, 'index']);

    //dashboard
    Route::prefix('dashboard')->group(function () {
        Route::get('/total-sales', [DashboardController::class, 'calculateTotalSales']);
        Route::get('/total-sales-per-day', [DashboardController::class, 'TotalSalesPerDay']);
        Route::get('/payment-chart', [DashboardController::class, 'GetPaymentChart']);
        Route::get('/average-sales-per-day',[DashboardController::class, 'calculateAverageSalesPerDay']);
        Route::get('/total-sales-per-day', [DashboardController::class, 'totalSalesPerDay']);
        Route::get('/stats', [DashboardController::class, 'getStats']);
        Route::get('/average-sales-per-customer', [DashboardController::class, 'getAverageSalesPerCustomer']);
        Route::get('/average-tx-per-day', [DashboardController::class, 'CalculateAverageTxPerDay']);	
        Route::get('/payment-details', [DashboardController::class, 'PaymentDetails']);	
    });

    Route::get('/bir-summary', [BirSummaryController::class, 'index']);
    Route::post('/bir-summary', [BirSummaryController::class, 'store']);

    Route::get('/product-mix', [ItemSalesController::class, 'ProductMix']);
    Route::get('/product-mix-category',[ItemSalesController::class, 'productMixCategory']);

    Route::get('/category', [CategoryController::class, 'index']);

    Route::get('/products', [ProductController::class, 'index']);

});

// Route::middleware(['auth:sanctum'])->group(function () {
//     Route::get('/bir-summary', [BirSummaryController::class, 'index']);
//     Route::post('/bir-summary', [BirSummaryController::class, 'store']);
    
//     // Hourly routes
 
// });
