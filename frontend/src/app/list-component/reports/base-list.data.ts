import { ConfirmWithInputData } from 'src/app/pop-up/confirm-with-input/confirm-with-input.component';
import { ConfirmData } from 'src/app/pop-up/confirm/confirm.component';
import { Action, BaseData, ConfirmType, DataType } from '../base-list/base-list.component';
import { Pagination } from '../pagination';

const headers = [
    { label: 'ID', key: 'id', type: DataType.STRING },
    { label: 'Handled', key: 'handled', type: DataType.BOOLEAN },
    { label: 'Reported by', key: 'reportedBy.name', type: DataType.STRING },
    { label: 'Description', key: 'description', type: DataType.TEXT },
    {
        label: 'Reported user',
        key: 'reportedUser.name',
        type: DataType.STRING,
    },
    { label: 'Banned', key: 'reportedUser.banned', type: DataType.BOOLEAN },
    {
        label: 'Banned reason',
        key: 'reportedUser.banned_reason',
        type: DataType.TEXT,
    },
    {
        label: 'Chat restricted',
        key: 'reportedUser.chat_restriction',
        type: DataType.BOOLEAN,
    },
    { label: 'Deleted at', key: 'deletedAt', type: DataType.DATE },
];

const confirmWithInputData: ConfirmWithInputData = {
    myName: 'ConfirmWithInputData',
    title: 'Ban user',
    message: 'Are you sure you want to ban this user? <br> Provide a reason if you want.',
    inputPlaceHolder: 'Reason',
    inputType: 'text',
    confirmButtonText: 'Ban',
    cancelButtonText: 'Cancel',
};
const confirmData: ConfirmData = {
    myName: 'ConfirmData',
    description: 'Are you sure you want to delete this report?',
};
const banHTML = `<i class="bi bi-exclamation-octagon-fill me-2 text-danger fs-4 "></i>`;
const slashedChatHTML = `
<div class="slashedChat position-relative me-2">
<i class=" fs-4 bi bi-chat position-absolute" ></i>
<div class="slashRotate position-absolute">
	<i class="fs-2 bi bi-slash-lg"></i>
</div>	
</div>
`;
const deleteHTML = `<i class="fs-4 bi bi-trash3-fill text-danger"></i>`;
const singularActions: Action[] = [
    {
        type: 'banUnban',
        HTML: banHTML,
        tooltip: 'Ban/Unban user',
        confirmRequired: report => {
            return !report.reportedUser.banned;
        },
        confirmType: ConfirmType.WITH_INPUT,
        confirmData: confirmWithInputData,
    },
    {
        type: 'chatRestriction',
        HTML: slashedChatHTML,
        tooltip: 'Add/Remove chat restriction to/from user',
        confirmRequired: () => false,
    },
    {
        type: 'delete',
        HTML: deleteHTML,
        tooltip: 'Delete report',
        confirmRequired: () => true,
        confirmType: ConfirmType.DEFAULT,
        confirmData: confirmData,
    },
];
const pluralActions: Action[] = [
    {
        type: 'banUnban',
        HTML: banHTML,
        tooltip: 'Ban/Unban selected users',
        confirmRequired: () => false,
    },
    {
        type: 'chatRestriction',
        HTML: slashedChatHTML,
        tooltip: 'Add/Remove chat restriction to/from selected users',
        confirmRequired: () => false,
    },
    {
        type: 'delete',
        HTML: deleteHTML,
        tooltip: 'Delete selected reports',
        confirmRequired: () => true,
        confirmType: ConfirmType.DEFAULT,
        confirmData: confirmData,
    },
];

export let baseData: BaseData = {
    pagination: new Pagination(0),
    headers: headers,
    data: [],
    singularActions: singularActions,
    pluralActions: pluralActions,
};
