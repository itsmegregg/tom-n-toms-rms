<?php

use App\Http\Controllers\BranchController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\ConceptController;
use App\Http\Controllers\HourlyController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\SettingsController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// Guest welcome page
Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
})->middleware('guest');

Route::middleware(['auth', 'verified'])->group(function () {
    // Redirect root to dashboard for authenticated users
    Route::get('/', function () {
        return redirect()->route('dashboard');
    });

    Route::get('/dashboard', function () {
        return Inertia::render('Dashboard/Index');
    })->name('dashboard');

    Route::get('/bir-summary', function () {
        return Inertia::render('BIR/Summary');
    })->name('bir-summary');
    
    Route::get('/settings', [SettingsController::class, 'index'])->name('settings');
    
    // API Routes
    Route::prefix('api')->group(function () {
        // Categories API Routes
        Route::prefix('categories')->group(function () {
            Route::get('/', [CategoryController::class, 'index']);
            Route::post('/', [CategoryController::class, 'store']);
            Route::put('/{id}', [CategoryController::class, 'updateCategory']);
            Route::delete('/{id}', [CategoryController::class, 'destroy']);
            Route::post('/import', [CategoryController::class, 'importCsv']);
        });

        // Branches API Routes
        Route::prefix('branches')->group(function () {
            Route::get('/', [BranchController::class, 'index']);
            Route::post('/', [BranchController::class, 'store']);
            Route::put('/{id}', [BranchController::class, 'update']);
            Route::delete('/{id}', [BranchController::class, 'destroy']);
        });

        // Concepts API Routes
        Route::prefix('concepts')->group(function () {
            Route::get('/', [ConceptController::class, 'index']);
            Route::post('/', [ConceptController::class, 'store']);
            Route::put('/{id}', [ConceptController::class, 'update']);
            Route::delete('/{id}', [ConceptController::class, 'destroy']);
        });
    });

    Route::post('/categories/import', [CategoryController::class, 'importCsv'])->name('categories.import');
    Route::resource('categories', CategoryController::class);
    Route::resource('concepts', ConceptController::class);
    Route::resource('branches', BranchController::class);


  
});

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    Route::get('item-sales/per-items', function () {
        return Inertia::render('ItemSales/perItems');
    })->name('item-sales.per-items');

    Route::get('item-sales/per-category', function () {
        return Inertia::render('ItemSales/perCategory');
    })->name('item-sales.per-category');

    Route::get('/daily-sales', function () {
        return Inertia::render('DailySales/Index');
    })->name('daily-sales');

    Route::get('/discount', function () {
        return Inertia::render('Discount/Index');
    })->name('discount');

    Route::get('/payment', function () {
        return Inertia::render('Payment/Index');
    })->name('payment');

    Route::get('/hourly', [HourlyController::class, 'index'])->middleware(['auth', 'verified'])->name('hourly');
    Route::get('/concepts', [HourlyController::class, 'getConcepts'])->name('concepts.list');

    Route::get('/bir-detailed', function () {
        return Inertia::render('BIR/Detailed');
    })->name('bir-detailed');

    Route::get('/government-discount', function () {
        return Inertia::render('GovernmentDiscount/Index');
    })->name('government-discount');


    Route::get('/void-tx', function(){
        return Inertia::render('VoidTx/Index');
    })->name('void-tx');	

    Route::get('/cashier-report', function(){
        return Inertia::render('CashierReport/Index');
    })->name('cashier-report');	
    
    Route::get('/fast-moving-item', function(){
        return Inertia::render('FastMovingItem/Index');
    })->name('fast-moving-item');
});

require __DIR__.'/auth.php';
