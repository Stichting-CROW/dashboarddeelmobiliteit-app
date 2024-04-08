import Button from "../Button/Button"

import { Payment, columns } from "./columns"
import { DataTable } from "../ui/data-table"
import { useEffect, useState } from "react"

// async function getData(): Promise<Payment[]> {
async function getData() {
    // Fetch data from your API here.
    return [
      {
        id: "728ed52f",
        amount: 100,
        status: "pending",
        email: "m@example.com",
      },
      // ...
    ]
}

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
    const [tableData, setTableData] = useState([]);
    useEffect(() => {
        (async () => {
            setTableData(await getData());
        })();
}, [])

    return (
        <div>
            <ActionHeader />
            <div data-name="body" className="p-4">
                <DataTable columns={columns} data={tableData} />
            </div>
        </div>
    );
}

export default PolicyHubsList;
