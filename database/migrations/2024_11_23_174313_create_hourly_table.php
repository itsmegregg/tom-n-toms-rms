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
        Schema::create('hourly', function (Blueprint $table) {
            $table->id('hourly_id');
            $table->foreignId('branch_id')->constrained('branches', 'branch_id');
            $table->foreignId('concept_id')->constrained('concepts', 'concept_id');
            $table->date('date');
            $table->integer('hour');
            $table->integer('no_tx');
            $table->integer('no_void');
            $table->decimal('sales_value', 10, 2);
            $table->decimal('discount_amount', 10, 2);
            $table->string('terminal');
            $table->timestamps();

            // Create indexes for better query performance
            $table->index(['date', 'hour']);
            $table->index('branch_id');
            $table->index('concept_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('hourly');
    }
};
