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
        Schema::create('bir_detailed', function (Blueprint $table) {
            $table->id();
            $table->foreignId('branch_id')->constrained('branches', 'branch_id');
            $table->foreignId('concept_id')->constrained('concepts', 'concept_id');
            $table->date('date');
            $table->integer('si_number');
            $table->decimal('vat_exempt', 12, 2)->nullable()->default(0);
            $table->decimal('vat_zero_rate', 12, 2)->nullable()->default(0);
            $table->decimal('vatable_amount', 12, 2)->nullable()->default(0);
            $table->decimal('vat_12', 12, 2)->nullable()->default(0);
            $table->decimal('less_vat', 12, 2)->nullable()->default(0);
            $table->decimal('gross_amount', 12, 2)->nullable()->default(0);
            $table->string('discount_type', 50)->nullable();
            $table->decimal('discount_amount', 12, 2)->nullable()->default(0);
            $table->decimal('service_charge', 12, 2)->nullable()->default(0);
            $table->decimal('net_total', 12, 2)->nullable()->default(0);
            $table->decimal('cash', 12, 2)->nullable()->default(0);
            $table->decimal('other_payment', 12, 2)->nullable()->default(0);
            $table->integer('tx_number');
            $table->timestamps();

            // Create indexes for better query performance
            $table->index('date');
            $table->index('branch_id');
            $table->index('concept_id');
            $table->index('si_number');
            $table->index('tx_number');
            $table->index(['date', 'branch_id', 'concept_id']);
            $table->unique(['branch_id', 'si_number', 'date'], 'unique_bir_transaction');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('bir_detailed');
    }
};
