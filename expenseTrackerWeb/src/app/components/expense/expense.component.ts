import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { NzMessageService } from 'ng-zorro-antd/message';
import { ExpenseService } from 'src/app/services/expense/expense.service';
import { NzModalService } from 'ng-zorro-antd/modal';
import * as moment from 'moment';

@Component({
  selector: 'app-expense',
  templateUrl: './expense.component.html',
  styleUrls: ['./expense.component.scss']
})
export class ExpenseComponent implements OnInit {
  expenses: any;
  expenseForm!: FormGroup;
  listOfCategory: any[] = ["Mua sắm", "Du lịch", "Học tập", "Ăn uống", "Tiền nhà"];
  customCategory: string = '';
  isListView: boolean = false;
  selectedMonth: number = new Date().getMonth() + 1;
  months = [
    { value: 1, label: 'Tháng 1' },
    { value: 2, label: 'Tháng 2' },
    { value: 3, label: 'Tháng 3' },
    { value: 4, label: 'Tháng 4' },
    { value: 5, label: 'Tháng 5' },
    { value: 6, label: 'Tháng 6' },
    { value: 7, label: 'Tháng 7' },
    { value: 8, label: 'Tháng 8' },
    { value: 9, label: 'Tháng 9' },
    { value: 10, label: 'Tháng 10' },
    { value: 11, label: 'Tháng 11' },
    { value: 12, label: 'Tháng 12' }
  ];
  currentYear: number = new Date().getFullYear();
  showPreviousYears: boolean = false;
  currentYearExpenses: any[] = [];
  previousYearsExpenses: any[] = [];
  selectedYear: number = new Date().getFullYear();
  availableYears: number[] = [];

  constructor(
    private fb: FormBuilder,
    private message: NzMessageService,
    private router: Router,
    private expenseService: ExpenseService,
    private modal: NzModalService,
    private route: Router
  ) {
    this.isListView = this.route.url.includes('expense-list');
  }

  ngOnInit() {
    this.getAllExpenses();
    this.expenseForm = this.fb.group({
      amount: [null, [Validators.required]],
      date: [null, [Validators.required, this.dateValidator()]],
      category: [null, [Validators.required]],
      description: [null, [Validators.required]],
    })
  }

  submitForm() {
    const selectedDate = moment(this.expenseForm.get('date')?.value);
    const today = moment().startOf('day');
    
    if (selectedDate.isAfter(today)) {
      this.message.error("Không thể thêm chi phí cho ngày trong tương lai!", { nzDuration: 5000 });
      return;
    }

    this.expenseService.postExpense(this.expenseForm.value).subscribe(res => {
      this.message.success("Thêm chi phí thành công", { nzDuration: 5000 });
      this.getAllExpenses();
      this.expenseForm.reset();
    }, error => {
      this.message.error("Lỗi", { nzDuration: 5000 });
    })
  }

  getAllExpenses() {
    this.expenseService.getAllExpenses().subscribe(res => {
      this.organizeExpensesByYear(res);
    }, error => {
      this.message.error("Error fetching expenses", { nzDuration: 5000 })
    });
  }

  organizeExpensesByYear(expenses: any[]) {
    const sortedExpenses = expenses.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    this.availableYears = Array.from(
      new Set(
        sortedExpenses.map(expense => new Date(expense.date).getFullYear())
      )
    ).sort((a, b) => b - a);

    const expensesByYear = new Map<number, Map<number, any[]>>();

    sortedExpenses.forEach(expense => {
      const date = new Date(expense.date);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;

      if (!expensesByYear.has(year)) {
        expensesByYear.set(year, new Map<number, any[]>());
      }
      
      const yearMap = expensesByYear.get(year)!;
      if (!yearMap.has(month)) {
        yearMap.set(month, []);
      }

      yearMap.get(month)!.push(expense);
    });

    const currentYearMap = expensesByYear.get(this.selectedYear) || new Map();
    this.currentYearExpenses = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      expenses: currentYearMap.get(i + 1) || []
    }));

    this.previousYearsExpenses = Array.from(expensesByYear.entries())
      .filter(([year, _]) => year < this.currentYear)
      .map(([year, monthMap]) => ({
        year,
        months: Array.from({ length: 12 }, (_, i) => ({
          month: i + 1,
          expenses: monthMap.get(i + 1) || []
        }))
      }))
      .sort((a, b) => b.year - a.year);
  }

  calculateMonthTotal(expenses: any[]): number {
    return expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
  }

  getCurrentMonthExpenses(): any[] {
    const monthData = this.currentYearExpenses.find(m => m.month === this.selectedMonth);
    return monthData ? monthData.expenses : [];
  }

  deleteExpense(id: number) {
    this.modal.confirm({
      nzTitle: 'Bạn có muốn xoá chi phí này?',
      nzOkText: 'Có',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzOnOk: () => this.confirmDelete(id),
      nzCancelText: 'Không',
      nzOnCancel: () => console.log('Huỷ')
    });
  }

  confirmDelete(id: number) {
    this.expenseService.deleteExpense(id).subscribe(res => {
      this.message.success("Xoá chi phí thành công", { nzDuration: 5000 });
      this.getAllExpenses();
    }, error => {
      this.message.error("Lỗi khi xoá chi phí", { nzDuration: 5000 });
    });
  }

  updateExpense(id: number) {
    this.modal.confirm({
      nzTitle: 'Xác nhận cập nhật',
      nzContent: 'Bạn có muốn cập nhật chi phí này?',
      nzOkText: 'Có',
      nzOkType: 'primary',
      nzOnOk: () => this.router.navigateByUrl(`/expense/${id}/edit`),
      nzCancelText: 'Không',
      nzOnCancel: () => console.log('Cancel')
    });
  }

  addCustomCategory() {
    if (this.customCategory && !this.listOfCategory.includes(this.customCategory)) {
      this.listOfCategory.push(this.customCategory);
      this.expenseForm.patchValue({
        category: this.customCategory
      });
      this.customCategory = '';
    }
  }

  dateValidator() {
    return (control: any) => {
      const selectedDate = moment(control.value);
      const today = moment().startOf('day');
      
      if (selectedDate.isAfter(today)) {
        return { futureDate: true };
      }
      return null;
    };
  }

  onDateChange(event: any) {
    const selectedDate = moment(event);
    const today = moment().startOf('day');
    
    if (selectedDate.isAfter(today)) {
      this.message.warning('Không thể chọn ngày trong tương lai!', {
        nzDuration: 3000
      });
      this.expenseForm.patchValue({
        date: null
      });
    }
  }

  disabledDate = (current: Date): boolean => {
    return current > new Date();
  };

  onYearChange(year: number) {
    this.selectedYear = year;
    this.getAllExpenses();
  }

  onMonthChange(month: number) {
    this.selectedMonth = month;
  }
}
