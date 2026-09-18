import DiscoveryPage from "@/components/discovery/discovery-page";
export default async function MapPage(props: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return <DiscoveryPage {...props} map />;
}
