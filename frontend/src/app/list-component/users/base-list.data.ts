import { ConfirmWithInputData } from 'src/app/pop-up/confirm-with-input/confirm-with-input.component';
import { Action, BaseData, ConfirmType, DataType } from '../base-list/base-list.component';

const header = [
    { label: 'ID', key: 'id', type: DataType.STRING },
    { label: 'Name', key: 'name', type: DataType.STRING },
    { label: 'Email', key: 'email', type: DataType.STRING },
    { label: 'Role', key: 'role', type: DataType.STRING },
    { label: 'Banned', key: 'banned', type: DataType.BOOLEAN },
    { label: 'Banned reason', key: 'banned_reason', type: DataType.TEXT },
    {
        label: 'Chat restricted',
        key: 'chat_restriction',
        type: DataType.BOOLEAN,
    },
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
const slashedChatHTML = `
	<div class="slashedChat position-relative me-2">
		<i class=" fs-4 bi bi-chat position-absolute" ></i>
		<div class="slashRotate position-absolute">
			<i class="fs-2 bi bi-slash-lg"></i>
		</div>
	</div>
`;
const singularActions: Action[] = [
    {
        type: 'banUnban',
        HTML: `<i class="me-2 text-danger fs-4 bi bi-person-fill-slash"></i>`,
        tooltip: 'Ban/Unban user',
        confirmRequired: () => false,
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
        type: 'makeAdmin',
        HTML: `<i class="text-success fs-4 bi bi-person-fill-up"></i>`,
        tooltip: 'Make user admin',
        confirmRequired: () => true,
        confirmType: ConfirmType.DEFAULT,
        confirmData: {
            myName: 'ConfirmData',
            description: 'Are you sure you want to make the user admin?',
        },
    },
];
const pluralActions: Action[] = [
    {
        type: 'banUnban',
        HTML: `<i class="me-2 text-danger fs-4 bi bi-person-fill-slash"></i>`,
        tooltip: 'Ban/Unban selected users',
        confirmRequired: (user: any) => {
            return !user?.banned;
        },
    },
    {
        type: 'chatRestriction',
        HTML: slashedChatHTML,
        tooltip: 'Add/Remove chat restriction to/from selected users',
        confirmRequired: () => false,
    },
];

export const baseData: BaseData = {
    headers: header,
    singularActions: singularActions,
    pluralActions: pluralActions,
    collectionSize: 0,
    page: 1,
    pageSize: 7,
    data: [],
};
