import { ConfirmWithInputData } from "src/app/pop-up/confirm-with-input/confirm-with-input.component";
import { ConfirmData } from "src/app/pop-up/confirm/confirm.component";
import { Action, BaseData, ConfirmType, DataType } from "../base-list/base-list.component";
import { Pagination } from "../pagination";

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
];

const pluralActions: Action[] = [
	{
		type: 'delete',
		HTML: deleteHTML,
		tooltip: 'Delete fields',
		confirmType: ConfirmType.DEFAULT,
		confirmRequired: () => true,
		confirmData: confirmData,
	}
];

export let adminBaseData: BaseData = {
	headers: headers,
	pagination: new Pagination(0),
	data: [],
	singularActions: singularActions,
	pluralActions: pluralActions,
};