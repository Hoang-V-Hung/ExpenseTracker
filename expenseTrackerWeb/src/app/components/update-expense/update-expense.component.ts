import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NzMessageService } from 'ng-zorro-antd/message';
import { ExpenseService } from 'src/app/services/expense/expense.service';
import * as moment from 'moment';

@Component({
  selector: 'app-update-expense',
  templateUrl: './update-expense.component.html',
  styleUrls: ['./update-expense.component.scss']
})
export class UpdateExpenseComponent {
  expenseForm!: FormGroup;
  id: any;
  listOfCategory: any[] = ["Mua sắm", "Du lịch", "Học tập", "Bitcoin", "Chuyển tiền"];
  customCategory: string = '';

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
      title: [null, [Validators.required]],
      amount: [null, [Validators.required]],
      date: [null, [Validators.required, this.dateValidator()]],
      category: [null, [Validators.required]],
      description: [null, [Validators.required]],
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
    const selectedDate = moment(this.expenseForm.get('date')?.value);
    const today = moment().startOf('day');
    
    if (selectedDate.isAfter(today)) {
      this.message.error("Không thể cập nhật chi phí cho ngày trong tương lai!", { nzDuration: 5000 });
      return;
    }

    this.expenseService.updateExpense(this.id, this.expenseForm.value).subscribe(res => {
      this.message.success("Cập nhật chi phí thành công", { nzDuration: 5000 });
      this.router.navigateByUrl('/expense-list');
    }, error => {
      this.message.error("Lỗi khi cập nhật chi phí", { nzDuration: 5000 });
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
    // Không cho phép chọn ngày trong tương lai
    return current > new Date();
  };
}