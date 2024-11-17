import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { NzMessageService } from 'ng-zorro-antd/message';
import { ExpenseService } from 'src/app/services/expense/expense.service';
import { NzModalService } from 'ng-zorro-antd/modal';
import * as moment from 'moment';
import { DateService } from 'src/app/services/date/date.service';
import { StatsService } from 'src/app/services/stats/stats.service';

@Component({
  selector: 'app-expense',
  templateUrl: './expense.component.html',
  styleUrls: ['./expense.component.scss']
})
export class ExpenseComponent implements OnInit {
  expenses: any;
  expenseForm!: FormGroup;
  listOfCategory: string[] = [];
  customCategories: string[] = [];
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
  @ViewChild('categoryInput') categoryInput: ElementRef;
  isAddingNewCategory: boolean = false;
  tempCategory: string = '';
  searchValue: string = '';
  currentInputValue: string = '';

  constructor(
    private fb: FormBuilder,
    private message: NzMessageService,
    private router: Router,
    private expenseService: ExpenseService,
    private modal: NzModalService,
    private route: Router,
    private dateService: DateService,
    private statsService: StatsService
  ) {
    this.isListView = this.route.url.includes('expense-list');
  }

  ngOnInit() {
    this.getAllExpenses();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    this.expenseForm = this.fb.group({
      amount: [null, [Validators.required]],
      date: [today, [Validators.required]],
      category: [null, [Validators.required]],
      description: [null, [Validators.required]]
    });
  }

  submitForm() {
    const selectedDate = moment(this.expenseForm.get('date')?.value).startOf('day');
    const today = moment().endOf('day');
    
    if (selectedDate.isAfter(today)) {
      this.message.error("Không thể thêm chi phí cho ngày trong tương lai!", { nzDuration: 5000 });
      return;
    }

    const formValue = { ...this.expenseForm.value };
    formValue.date = moment(formValue.date).format('YYYY-MM-DD');

    this.expenseService.postExpense(formValue).subscribe(res => {
      this.message.success("Thêm chi phí thành công", { nzDuration: 5000 });
      this.getAllExpenses();
      this.expenseForm.reset();

      this.statsService.refreshStats();

      const resetToday = moment().startOf('day').toDate();
      this.expenseForm.patchValue({
        date: resetToday
      });

      this.currentInputValue = '';
      this.searchValue = '';
    }, error => {
      this.message.error("Lỗi", { nzDuration: 5000 });
    });
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
      this.statsService.refreshStats();
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

  onCategoryChange(value: string) {
    if (value && value !== this.expenseForm.get('category')?.value) {
      this.expenseForm.get('category')?.setValue(value, { emitEvent: false });
      this.currentInputValue = value;
    }
  }

  onCategorySearch(value: string) {
    if (value?.trim()) {
      this.currentInputValue = value.trim();
    }
  }

  onCategoryKeyEnter() {
    if (this.currentInputValue?.trim()) {
      const newValue = this.currentInputValue.trim();
      
      const existingCategory = this.listOfCategory.find(
        cat => cat.toLowerCase() === newValue.toLowerCase()
      );

      if (!existingCategory) {
        this.listOfCategory = [newValue, ...this.listOfCategory];
      }

      this.expenseForm.get('category')?.setValue(newValue, { emitEvent: false });
    }
  }

  removeCategory(category: string, event: MouseEvent) {
    event.stopPropagation();
    
    this.listOfCategory = this.listOfCategory.filter(
      cat => cat.toLowerCase() !== category.toLowerCase()
    );
    
    if (this.expenseForm.get('category')?.value?.toLowerCase() === category.toLowerCase()) {
      this.expenseForm.patchValue({
        category: null
      });
      this.currentInputValue = '';
    }

    this.message.success(`Đã xóa "${category}" khỏi danh sách`, { 
      nzDuration: 2000
    });
  }

  getFilteredCategories(): string[] {
    const searchTerm = this.searchValue.toLowerCase();
    const allCategories = [...new Set(this.customCategories)];
    
    if (!searchTerm) {
      return allCategories;
    }

    return allCategories.filter(cat => 
      cat.toLowerCase().includes(searchTerm)
    );
  }

  dateValidator() {
    return (control: any) => {
      const selectedDate = moment(control.value);
      const today = moment().endOf('day');
      
      if (selectedDate.isAfter(today)) {
        return { futureDate: true };
      }
      return null;
    };
  }

  onDateChange(event: any) {
    const selectedDate = moment(event);
    const today = moment().endOf('day');
    
    if (selectedDate.isAfter(today)) {
      this.message.warning('Không thể chọn ngày trong tương lai!', {
        nzDuration: 3000
      });
      this.expenseForm.patchValue({
        date: moment().startOf('day').toDate()
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

  getAllCategories(): string[] {
    return [...this.listOfCategory, ...this.customCategories];
  }
}
