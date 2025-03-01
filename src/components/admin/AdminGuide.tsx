
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { AlertTriangle, ShieldCheck, Trash2, User, UserCheck, Eye, Info, MessageSquare } from "lucide-react";

export function AdminGuide() {
  return (
    <Card className="border-blue-500/30 bg-secondary/50 backdrop-blur-sm shadow-[0_0_15px_rgba(59,130,246,0.1)]">
      <CardHeader>
        <CardTitle className="text-blue-500 flex items-center gap-2">
          <Info className="h-5 w-5" />
          Admin User Guide
        </CardTitle>
        <CardDescription>
          Reference guide for admin features and responsibilities
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="item-1">
            <AccordionTrigger className="text-indigo-600 hover:text-indigo-700">
              <div className="flex items-center gap-2">
                <UserCheck className="h-4 w-4" />
                User Management
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <ul className="space-y-2 text-sm pl-6">
                <li className="list-disc">
                  <span className="font-medium">View User Profiles:</span> Click the "View Profile" button to see detailed user information and their listings.
                </li>
                <li className="list-disc">
                  <span className="font-medium">User Verification:</span> Verify users by approving their KYC documents in the KYC tab.
                </li>
                <li className="list-disc">
                  <span className="font-medium">Admin Privileges:</span> Grant or revoke admin privileges to trusted users.
                </li>
              </ul>
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="item-2">
            <AccordionTrigger className="text-rose-600 hover:text-rose-700">
              <div className="flex items-center gap-2">
                <Trash2 className="h-4 w-4" />
                Post Moderation
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <ul className="space-y-2 text-sm pl-6">
                <li className="list-disc">
                  <span className="font-medium">View Posts:</span> Browse all user listings in the Posts tab or visit individual item pages.
                </li>
                <li className="list-disc">
                  <span className="font-medium">Delete Posts:</span> Remove inappropriate content by clicking the "Delete" button on the post.
                </li>
                <li className="list-disc">
                  <span className="font-medium">Delete Button:</span> As an admin, you'll see a delete button on all posts, even if you're not the owner.
                </li>
                <li className="list-disc">
                  <span className="font-medium">User Notification:</span> When you delete a post, the user will be notified about the deletion.
                </li>
              </ul>
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="item-3">
            <AccordionTrigger className="text-amber-600 hover:text-amber-700">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" />
                KYC Verification
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <ul className="space-y-2 text-sm pl-6">
                <li className="list-disc">
                  <span className="font-medium">KYC Documents:</span> Review submitted identity documents in the KYC tab.
                </li>
                <li className="list-disc">
                  <span className="font-medium">Approve/Reject:</span> After reviewing, either approve (verify) or reject the document.
                </li>
                <li className="list-disc">
                  <span className="font-medium">Add Notes:</span> Include notes about why a document was rejected to help users fix their submission.
                </li>
              </ul>
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="item-4">
            <AccordionTrigger className="text-green-600 hover:text-green-700">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Communication
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <ul className="space-y-2 text-sm pl-6">
                <li className="list-disc">
                  <span className="font-medium">User Notifications:</span> The system automatically notifies users about post deletions and KYC updates.
                </li>
                <li className="list-disc">
                  <span className="font-medium">Clear Communication:</span> Always provide clear reasons when rejecting KYC documents or deleting posts.
                </li>
                <li className="list-disc">
                  <span className="font-medium">Moderation Guidelines:</span> Follow community guidelines when making moderation decisions.
                </li>
              </ul>
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="item-5">
            <AccordionTrigger className="text-purple-600 hover:text-purple-700">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Best Practices
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <ul className="space-y-2 text-sm pl-6">
                <li className="list-disc">
                  <span className="font-medium">Regular Monitoring:</span> Check the dashboard regularly for new posts and KYC submissions.
                </li>
                <li className="list-disc">
                  <span className="font-medium">Be Consistent:</span> Apply moderation rules consistently across all users.
                </li>
                <li className="list-disc">
                  <span className="font-medium">Document Actions:</span> Keep track of moderation actions for future reference.
                </li>
                <li className="list-disc">
                  <span className="font-medium">Admin Privacy:</span> Keep admin actions and discussions confidential.
                </li>
              </ul>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}
