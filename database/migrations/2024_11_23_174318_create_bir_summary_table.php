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
        Schema::create('bir_summary', function (Blueprint $table) {
            $table->id();
            $table->foreignId('branch_id')->constrained('branches', 'branch_id');
            $table->foreignId('concept_id')->constrained('concepts', 'concept_id');
            $table->date('date');
            $table->integer('si_first')->nullable();
            $table->integer('si_last')->nullable();
            $table->decimal('beg_amount', 12, 2)->nullable()->default(0);
            $table->decimal('end_amount', 12, 2)->nullable()->default(0);
            $table->decimal('net_amount', 12, 2)->default(0);
            $table->decimal('sc', 12, 2)->nullable()->default(0);
            $table->decimal('pwd', 12, 2)->nullable()->default(0);
            $table->decimal('others', 12, 2)->nullable()->default(0);
            $table->decimal('returns', 12, 2)->nullable()->default(0);
            $table->decimal('voids', 12, 2)->nullable()->default(0);
            $table->decimal('gross_amount', 12, 2)->nullable()->default(0);
            $table->decimal('vatable', 12, 2)->nullable()->default(0);
            $table->decimal('vat_amount', 12, 2)->nullable()->default(0);
            $table->decimal('vat_exempt', 12, 2)->nullable()->default(0);
            $table->decimal('zero_rated', 12, 2)->nullable()->default(0);
            $table->decimal('less_vat', 12, 2)->nullable()->default(0);
            $table->decimal('ewt', 12, 2)->nullable()->default(0);
            $table->decimal('service_charge', 12, 2)->nullable()->default(0);
            $table->integer('z_counter')->nullable();
            $table->timestamps();

            // Create indexes for better query performance
            $table->index('date');
            $table->index('branch_id');
            $table->index('concept_id');
            $table->index('z_counter');
            $table->index(['date', 'branch_id', 'concept_id']);
            $table->unique(['branch_id', 'date', 'z_counter'], 'unique_bir_summary');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('bir_summary');
    }
};
