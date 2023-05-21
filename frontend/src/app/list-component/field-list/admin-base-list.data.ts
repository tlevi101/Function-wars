import { ConfirmData } from 'src/app/pop-up/confirm/confirm.component';
import { Action, BaseData, ConfirmType, DataType } from '../base-list/base-list.component';

const headers = [
    { label: 'ID', key: 'id', type: DataType.STRING },
    { label: 'Name', key: 'name', type: DataType.STRING },
    { label: 'Created By', key: 'user.name', type: DataType.STRING },
    { label: 'Deleted at', key: 'deletedAt', type: DataType.DATE },
    { label: 'Updated at', key: 'updatedAt', type: DataType.DATE },
];

const confirmData: ConfirmData = {
    myName: 'ConfirmData',
    description: 'Are you sure you want to delete this/these field(s)?',
};

const deleteHTML = `<i class="fs-4 bi bi-trash3-fill text-danger"></i>`;
const editHTML = `<i class="fs-4 bi bi-pencil-square text-primary"></i>`;
const restoreHTML = `<i class="fs-4 text-primary bi bi-arrow-clockwise"></i>`;

const singularActions: Action[] = [
    {
        type: 'edit',
        HTML: editHTML,
        tooltip: 'Edit field',
        confirmRequired: () => false,
    },
    {
        type: 'delete',
        HTML: deleteHTML,
        tooltip: 'Delete field',
        confirmType: ConfirmType.DEFAULT,
        confirmRequired: () => true,
        confirmData: confirmData,
    },
    {
        type: 'restore',
        HTML: restoreHTML,
        tooltip: 'Restore Field',
        confirmRequired: () => false,
        visibleWhen: (field: any) => {
            return field.deletedAt !== null;
        },
    },
];

const pluralActions: Action[] = [
    {
        type: 'delete',
        HTML: deleteHTML,
        tooltip: 'Delete fields',
        confirmType: ConfirmType.DEFAULT,
        confirmRequired: () => true,
        confirmData: confirmData,
    },
];

export const adminBaseData: BaseData = {
    headers: headers,
    collectionSize: 0,
    pageSize: 7,
    page: 1,
    data: [],
    singularActions: singularActions,
    pluralActions: pluralActions,
};
