<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Branch_name,Cashier,Gross Sales,Net Sales,Cash,Card,Less Vat,
     * Discount,Delivery Charge,Service Charge,Void Amount,Void Count,Tx Count,Date,Concept_name

     */
    public function up(): void
    {
        Schema::create('cashier', function (Blueprint $table) {
            $table->id('cashier_id');
            $table->unsignedBigInteger('branch_id');
            $table->unsignedBigInteger('concept_id')->nullable();
            $table->string('cashier', 100);
            $table->decimal('gross_sales', 12, 2)->default(0);
            $table->decimal('net_sales', 12, 2)->default(0);
            $table->decimal('cash', 12, 2)->default(0);
            $table->decimal('card', 12, 2)->default(0);
            $table->decimal('less_vat', 12, 2)->default(0);
            $table->decimal('discount', 12, 2)->default(0);
            $table->decimal('delivery_charge', 12, 2)->default(0);
            $table->decimal('service_charge', 12, 2)->default(0);
            $table->decimal('void_amount', 12, 2)->default(0);
            $table->integer('void_count')->default(0);
            $table->integer('tx_count')->default(0);
            $table->date('date');
            $table->timestamps();

            // Foreign keys with correct references
            $table->foreign('branch_id')->references('branch_id')->on('branches');
            $table->foreign('concept_id')->references('concept_id')->on('concepts');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('cashier');
    }
};
