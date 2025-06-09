<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('payment_details', function (Blueprint $table) {
            $table->id('payment_id');
            $table->foreignId('branch_id')->constrained('branches', 'branch_id');
            $table->foreignId('concept_id')->constrained('concepts', 'concept_id');
            $table->date('date');
            $table->string('reg', 25);
            $table->string('pay_type', 15)->nullable();
            $table->string('description', 50);
            $table->decimal('amount', 12, 2);
            $table->time('transaction_time')->nullable();
            $table->string('receipt_no', 50)->nullable();
            $table->string('cashier_name', 50)->nullable();
            $table->timestamps();

            // Create indexes for better query performance
            $table->index('date');
            $table->index('branch_id');
            $table->index('concept_id');
            $table->index('pay_type');
            $table->index('receipt_no');
            $table->index(['date', 'branch_id', 'concept_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payment_details');
    }
};
