import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Pagination } from '../pagination';

@Component({
    selector: 'app-pagination',
    templateUrl: './pagination.component.html',
    styleUrls: ['./pagination.component.scss'],
})
export class PaginationComponent implements OnInit {
    pagination: Pagination;
    @Input() collectionSize = 0;
    @Input() pageSize = 7;
    @Output() pageChanged = new EventEmitter<number>();
    constructor() {
        this.pagination = new Pagination(0);
    }

    ngOnInit(): void {
        this.pagination = new Pagination(this.collectionSize, this.pageSize);
    }

    turnPageTo(page: number) {
        this.pagination.turnPageTo(page);
        this.pageChanged.emit(this.pagination.page);
    }
    turnPageNext() {
        this.pagination.incrementCurrentPageBy(1);
        this.pageChanged.emit(this.pagination.page);
    }
    turnPagePrevious() {
        this.pagination.incrementCurrentPageBy(-1);
        this.pageChanged.emit(this.pagination.page);
    }
}
