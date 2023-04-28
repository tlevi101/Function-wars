import { ConfirmWithInputData } from 'src/app/pop-up/confirm-with-input/confirm-with-input.component';
import { Action, BaseData, ConfirmType, DataType } from '../base-list/base-list.component';
import { DecodedToken } from 'src/app/interfaces/token.interface';

const header = [
    { label: 'ID', key: 'id', type: DataType.STRING },
    { label: 'Name', key: 'name', type: DataType.STRING },
    { label: 'Email', key: 'email', type: DataType.STRING },
    { label: 'Role', key: 'role', type: DataType.STRING },
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
		type: 'removeAdmin',
		HTML: `<i class="text-danger fs-4 bi bi-person-fill-down"></i>`,
		tooltip: 'Remove admin permission',
		confirmRequired: () => true,
		confirmType: ConfirmType.DEFAULT,
		visibleWhen(data, user?:DecodedToken) {
			return data.role !== 'super_admin' && data.id !== user?.id;
		},
		confirmData: {
			myName: "ConfirmData",
			description: "Are you sure you want to remove admin permissions?",
		}
	}
];

const pluralActions: Action[] = []

export const baseData: BaseData = {
    headers: header,
    singularActions: singularActions,
    pluralActions: pluralActions,
    collectionSize: 0,
    page: 1,
    pageSize: 7,
    data: [],
};
