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
        Schema::create('void_tx', function (Blueprint $table) {
            $table->id();
            $table->foreignId('branch_id')->constrained();
            $table->foreignId('concept_id')->constrained();
            $table->date('date');
            $table->time('time');
            $table->integer('tx_number');	
            $table->string('terminal', 25);
            $table->integer('salesinvoice_number')->unique();
            $table->string('cashier_name', 25);
            $table->decimal('amount', 12, 5);	
            $table->string('approved_by', 25);
            $table->string('remarks', 100);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('void_tx');
    }
};
