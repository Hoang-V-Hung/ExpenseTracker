import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NzMessageService } from 'ng-zorro-antd/message';
import { ExpenseService } from 'src/app/services/expense/expense.service';
import * as moment from 'moment';
import { differenceInCalendarDays } from 'date-fns';

@Component({
  selector: 'app-update-expense',
  templateUrl: './update-expense.component.html',
  styleUrls: ['./update-expense.component.scss']
})
export class UpdateExpenseComponent implements OnInit {
  expenseForm!: FormGroup;
  id: any;
  listOfCategory: string[] = [];
  currentInputValue: string = '';

  constructor(
    private fb: FormBuilder,
    private expenseService: ExpenseService,
    private message: NzMessageService,
    private router: Router,
    private activatedRoute: ActivatedRoute
  ) {
    this.id = this.activatedRoute.snapshot.params['id'];
  }

  ngOnInit() {
    this.expenseForm = this.fb.group({
      amount: [null, [Validators.required]],
      date: [moment().startOf('day').toDate(), [Validators.required]],
      category: [null, [Validators.required]],
      description: [null, [Validators.required]]
    });

    this.getExpenseById();
  }

  getExpenseById() {
    this.expenseService.getExpenseById(this.id).subscribe(res => {
      console.log(res);
      this.expenseForm.patchValue({
        title: res.title,
        amount: res.amount,
        date: res.date,
        category: res.category,
        description: res.description
      });
    });
  }

  submitForm() {
    const selectedDate = moment(this.expenseForm.get('date')?.value).startOf('day');
    const today = moment().endOf('day');
    
    if (selectedDate.isAfter(today)) {
      this.message.error("Không thể cập nhật chi phí cho ngày trong tương lai!", { nzDuration: 5000 });
      return;
    }

    const formValue = { ...this.expenseForm.value };
    formValue.date = moment(formValue.date).format('YYYY-MM-DD');

    this.expenseService.updateExpense(this.id, formValue).subscribe(res => {
      this.message.success("Cập nhật chi phí thành công", { nzDuration: 5000 });
      this.router.navigateByUrl('/expense-list');
    }, error => {
      this.message.error("Lỗi khi cập nhật chi phí", { nzDuration: 5000 });
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
      this.expenseForm.patchValue({
        date: moment().startOf('day').toDate()
      });
    }
  }

  disabledDate = (current: Date): boolean => {
    return current > new Date();
  };

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
}
