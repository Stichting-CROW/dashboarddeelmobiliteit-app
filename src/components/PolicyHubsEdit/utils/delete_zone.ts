import { notify } from "../../../helpers/notify";
import { toast } from "../../ui/use-toast";
import { deleteHub } from "../../../helpers/policy-hubs/delete-hub";
import { deleteHubs } from "../../../helpers/policy-hubs/delete-hubs";

export const deleteZoneHandler = async (e, geography_ids, token, dispatch, setSelectedPolicyHubs, setShowEditForm, postSaveOrDeleteCallback) => {
  if(! geography_ids || geography_ids.length === 0) return;

  if(! window.confirm(`Weet je zeker dat je deze hub${geography_ids.length > 1 ? 's' : ''} wilt verwijderen?`)) {
    notify(toast, '', {
      title: 'Verwijderen geannuleerd',
    });
    return;
  }

  try {
    console.log('Delete geography_ids', geography_ids, geography_ids.length);
    const response = geography_ids.length > 1
      ? await deleteHubs(token, geography_ids)
      : await deleteHub(token, geography_ids[0])
    ;
    console.log('Delete reponse', response);

    if(response && response.detail) {
      // Give error if something went wrong
      notify(toast, 'Er ging iets fout bij het verwijderen', {
          title: 'Er ging iets fout',
          variant: 'destructive'
      });
    }
    else {
      notify(toast, `Zone${geography_ids.length > 1 ? 's' : ''} verwijderd`);

      // Hide edit form
      dispatch(setSelectedPolicyHubs([]))
      dispatch(setShowEditForm(false));

      postSaveOrDeleteCallback();
    }
  } catch(err) {
    console.error('Delete error', err);
  }
};
