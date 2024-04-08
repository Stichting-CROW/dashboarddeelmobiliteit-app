import Button from "../Button/Button"

const ActionHeader = () => {
    return (
        <div className="flex justify-between">
            <div className="flex justify-start">
                <Button theme="white">
                    Stel vast
                </Button>
                <Button theme="white">
                    Bewerk
                </Button>
                <Button theme="white">
                    Verwijder
                </Button>
            </div>
            <div className="flex justify-end">
               <Button theme="white">
                    Filter
                </Button>
                <Button theme="white">
                    Download
                </Button>
            </div>
        </div>
    );
}

const PolicyHubsList = () => {
    return (
        <div>
            <ActionHeader />
            <div data-name="body" className="p-4">
                Lijstweergave
            </div>
        </div>
    );
}

export default PolicyHubsList;
