import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { NzMessageService } from 'ng-zorro-antd/message';
import { IncomeService } from 'src/app/services/income/income.service';
import { NzModalService } from 'ng-zorro-antd/modal';
import * as moment from 'moment';
import { DateService } from 'src/app/services/date/date.service';
import { StatsService } from 'src/app/services/stats/stats.service';

@Component({
  selector: 'app-income',
  templateUrl: './income.component.html',
  styleUrls: ['./income.component.scss']
})
export class IncomeComponent implements OnInit {
  incomes: any;
  incomeForm!: FormGroup;
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
  currentYearIncomes: any[] = [];
  previousYearsIncomes: any[] = [];
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
    private incomeService: IncomeService,
    private modal: NzModalService,
    private route: Router,
    private dateService: DateService,
    private statsService: StatsService
  ) {
    this.isListView = this.route.url.includes('income-list');
  }

  ngOnInit() {
    this.getAllIncomes();
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set thời gian về 00:00:00

    this.incomeForm = this.fb.group({
      amount: [null, [Validators.required]],
      date: [today, [Validators.required]], // Sử dụng today đã được set
      category: [null, [Validators.required]],
      description: [null, [Validators.required]]
    });
  }

  submitForm() {
    const selectedDate = moment(this.incomeForm.get('date')?.value).startOf('day');
    const today = moment().endOf('day');
    
    if (selectedDate.isAfter(today)) {
      this.message.error("Không thể thêm thu nhập cho ngày trong tương lai!", { nzDuration: 5000 });
      return;
    }

    // Tạo bản sao của form value để xử lý ngày
    const formValue = { ...this.incomeForm.value };
    // Đảm bảo ngày được gửi đi đúng với ngày đã chọn
    formValue.date = moment(formValue.date).format('YYYY-MM-DD');

    this.incomeService.postIncome(formValue).subscribe(res => {
      this.message.success("Thêm thu nhập thành công", { nzDuration: 5000 });
      this.getAllIncomes();
      this.incomeForm.reset();
      
      this.statsService.refreshStats();

      const resetToday = moment().startOf('day').toDate();
      this.incomeForm.patchValue({
        date: resetToday
      });

      this.currentInputValue = '';
      this.searchValue = '';
    }, error => {
      this.message.error("Lỗi", { nzDuration: 5000 });
    });
  }

  getAllIncomes() {
    this.incomeService.getAllIncomes().subscribe(res => {
      this.organizeIncomesByYear(res);
    }, error => {
      this.message.error("Error fetching incomes", { nzDuration: 5000 })
    });
  }

  organizeIncomesByYear(incomes: any[]) {
    // Sắp xếp thu nhập theo ngày giảm dần
    const sortedIncomes = incomes.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    // Tạo danh sách các năm có sẵn
    this.availableYears = Array.from(
      new Set(
        sortedIncomes.map(income => new Date(income.date).getFullYear())
      )
    ).sort((a, b) => b - a);

    // Tạo map để nhóm theo năm và tháng
    const incomesByYear = new Map<number, Map<number, any[]>>();

    sortedIncomes.forEach(income => {
      const date = new Date(income.date);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;

      if (!incomesByYear.has(year)) {
        incomesByYear.set(year, new Map<number, any[]>());
      }
      
      const yearMap = incomesByYear.get(year)!;
      if (!yearMap.has(month)) {
        yearMap.set(month, []);
      }

      yearMap.get(month)!.push(income);
    });

    // Xử lý năm hiện tại
    const currentYearMap = incomesByYear.get(this.selectedYear) || new Map();
    this.currentYearIncomes = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      incomes: currentYearMap.get(i + 1) || []
    }));

    // Xử lý các năm trước
    this.previousYearsIncomes = Array.from(incomesByYear.entries())
      .filter(([year, _]) => year < this.currentYear)
      .map(([year, monthMap]) => ({
        year,
        months: Array.from({ length: 12 }, (_, i) => ({
          month: i + 1,
          incomes: monthMap.get(i + 1) || []
        }))
      }))
      .sort((a, b) => b.year - a.year);
  }

  calculateMonthTotal(incomes: any[]): number {
    return incomes.reduce((sum, income) => sum + Number(income.amount), 0);
  }

  deleteIncome(id: number) {
    this.modal.confirm({
      nzTitle: 'Bạn có muốn xoá thu nhập này?',
      nzOkText: 'Có',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzOnOk: () => this.confirmDelete(id),
      nzCancelText: 'Không',
      nzOnCancel: () => console.log('Huỷ')
    });
  }

  confirmDelete(id: number) {
    this.incomeService.deleteIncome(id).subscribe(res => {
      this.message.success("Xoá thu nhập thành công", { nzDuration: 5000 });
      this.getAllIncomes();
      this.statsService.refreshStats();
    }, error => {
      this.message.error("Lỗi khi xoá thu nhập", { nzDuration: 5000 });
    });
  }

  updateIncome(id: number) {
    this.modal.confirm({
      nzTitle: 'Xác nhận cập nhật',
      nzContent: 'Bạn có muốn cập nhật thu nhập này?',
      nzOkText: 'Có',
      nzOkType: 'primary',
      nzOnOk: () => this.router.navigateByUrl(`/income/${id}/edit`),
      nzCancelText: 'Không',
      nzOnCancel: () => console.log('Cancel')
    });
  }

  onCategoryChange(value: string) {
    if (value && value !== this.incomeForm.get('category')?.value) {
      this.incomeForm.get('category')?.setValue(value, { emitEvent: false });
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

      this.incomeForm.get('category')?.setValue(newValue, { emitEvent: false });
    }
  }

  removeCategory(category: string, event: MouseEvent) {
    event.stopPropagation();
    
    this.listOfCategory = this.listOfCategory.filter(
      cat => cat.toLowerCase() !== category.toLowerCase()
    );
    
    if (this.incomeForm.get('category')?.value?.toLowerCase() === category.toLowerCase()) {
      this.incomeForm.patchValue({
        category: null
      });
      this.currentInputValue = '';
    }

    this.message.success(`Đã xóa "${category}" khỏi danh sách`, { 
      nzDuration: 2000
    });
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
      this.incomeForm.patchValue({
        date: moment().startOf('day').toDate()
      });
    }
  }

  disabledDate = (current: Date): boolean => {
    return current > new Date();
  };

  getCurrentMonthIncomes(): any[] {
    const monthData = this.currentYearIncomes.find(m => m.month === this.selectedMonth);
    return monthData ? monthData.incomes : [];
  }

  onYearChange(year: number) {
    this.selectedYear = year;
    this.getAllIncomes();
  }

  onMonthChange(month: number) {
    this.selectedMonth = month;
  }

  getAllCategories(): string[] {
    return [...this.listOfCategory, ...this.customCategories];
  }

  getFilteredCategories(): string[] {
    const searchTerm = this.searchValue.toLowerCase();
    const allCategories = [...new Set(this.customCategories)]; // Loại bỏ trùng lặp
    
    if (!searchTerm) {
      return allCategories;
    }

    return allCategories.filter(cat => 
      cat.toLowerCase().includes(searchTerm)
    );
  }
}
