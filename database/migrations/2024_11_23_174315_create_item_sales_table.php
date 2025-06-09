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
        Schema::create('item_sales', function (Blueprint $table) {
            $table->id('item_sales_id');
            $table->foreignId('branch_id')->constrained('branches', 'branch_id');
            $table->foreignId('concept_id')->constrained('concepts', 'concept_id');
            $table->date('date');
            $table->string('reg', 25);
            $table->string('category_code', 15);
            $table->string('sub_item_code', 15);
            $table->string('product_code', 25);
            $table->string('description', 255);
            $table->decimal('quantity', 10, 2);
            $table->decimal('total_gross', 12, 2);
            $table->decimal('net_sales', 12, 2);
            $table->decimal('charges', 12, 2)->default(0);
            $table->decimal('vatable_sales', 12, 2)->default(0);
            $table->decimal('vat_exempt_sales', 12, 2)->default(0);
            $table->decimal('zero_rated', 12, 2)->default(0);
            $table->decimal('senior_disc', 12, 2)->default(0);
            $table->decimal('pwd_disc', 12, 2)->default(0);
            $table->decimal('other_disc', 12, 2)->default(0);
            $table->decimal('open_disc', 12, 2)->default(0);
            $table->decimal('employee_disc', 12, 2)->default(0);
            $table->decimal('vip_disc', 12, 2)->default(0);
            $table->decimal('promo', 12, 2)->default(0);
            $table->decimal('free', 12, 2)->default(0);
            $table->decimal('voided', 12, 2)->default(0);
            $table->decimal('combo_meal', 12, 2)->default(0);
            $table->integer('combo_qty')->default(0);
            $table->decimal('service_charge', 12, 2)->default(0);
            $table->decimal('other_charges', 12, 2)->default(0);
            $table->decimal('total_cost', 12, 2)->default(0);
            $table->string('combo_main_code', 20)->nullable();
            $table->string('sub_item_code1')->nullable();
            $table->time('transaction_time')->nullable();
            $table->string('receipt_no', 50)->nullable();
            $table->string('cashier_name', 50)->nullable();
            $table->timestamps();

            // Create indexes for better query performance
            $table->index('date');
            $table->index('branch_id');
            $table->index('concept_id');
            $table->index('product_code');
            $table->index('category_code');
            $table->index(['date', 'branch_id', 'concept_id']);
            $table->index(['product_code', 'category_code']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('item_sales');
    }
};
